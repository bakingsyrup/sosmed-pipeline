#!/usr/bin/env python3
import sys
import os
import json
import re
import subprocess
import argparse
from datetime import datetime, timedelta

def parse_vtt_timestamps(vtt_file):
    """Parses a WebVTT file and returns a list of (start_seconds, end_seconds, text) tuples."""
    if not os.path.exists(vtt_file):
        return []
    
    entries = []
    timestamp_pattern = re.compile(r'(\d{2}:)?(\d{2}):(\d{2})[\.,](\d{3})\s*-->\s*(\d{2}:)?(\d{2}):(\d{2})[\.,](\d{3})')
    
    with open(vtt_file, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
        
    for i, line in enumerate(lines):
        match = timestamp_pattern.search(line)
        if match:
            start_h, start_m, start_s, _, end_h, end_m, end_s, _ = match.groups()
            
            start_sec = (int(start_h[:-1]) if start_h else 0) * 3600 + int(start_m) * 60 + int(start_s)
            end_sec = (int(end_h[:-1]) if end_h else 0) * 3600 + int(end_m) * 60 + int(end_s)
            
            text_lines = []
            j = i + 1
            while j < len(lines) and lines[j].strip() and not timestamp_pattern.search(lines[j]) and not lines[j].startswith('NOTE'):
                clean_text = re.sub(r'<[^>]+>', '', lines[j].strip())
                if clean_text:
                    text_lines.append(clean_text)
                j += 1
                
            text = " ".join(text_lines)
            if text:
                entries.append((start_sec, end_sec, text))
                
    return entries

def find_best_time_window(vtt_entries, keywords, target_duration=45, min_duration=25, max_duration=60):
    """Finds the best start and end timestamp window (in seconds) matching the keywords."""
    if not vtt_entries:
        return None, None, 0
        
    keyword_list = [k.lower().strip() for k in keywords if k.strip()]

    best_score = 0
    best_start = 0
    best_end = 0

    for i, (start_sec, _, _) in enumerate(vtt_entries):
        window_end_target = start_sec + target_duration
        current_text = []
        actual_end_sec = start_sec
        
        for s_sec, e_sec, text in vtt_entries[i:]:
            if s_sec > window_end_target:
                break
            current_text.append(text)
            actual_end_sec = e_sec
            
        combined_text = " ".join(current_text).lower()
        
        if keyword_list:
            score = sum(combined_text.count(kw) for kw in keyword_list)
        else:
            score = 1 # Fallback for general B-roll where any timestamp window is fine
            
        duration = actual_end_sec - start_sec
        if duration >= min_duration and duration <= max_duration:
            if score > best_score or (best_score == 0 and score == 0):
                best_score = score
                best_start = max(0, start_sec - 2)
                best_end = actual_end_sec + 2

    return best_start, best_end, best_score

def format_seconds_to_tc(seconds):
    """Converts seconds into HH:MM:SS format for yt-dlp section cutting."""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    if h > 0:
        return f"{h:02d}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"

def classify_channel(video_info, subject_entity):
    """Dynamically classifies channel priority (1=Primary Entity, 2=Verified News, 3=Other)."""
    channel_name = video_info.get('uploader', '').lower()
    is_verified = video_info.get('channel_is_verified', False) or video_info.get('verified', False)
    entity_lower = subject_entity.lower() if subject_entity else ""
    
    if entity_lower and entity_lower in channel_name:
        return 1
        
    media_keywords = ['news', 'bloomberg', 'cnbc', 'reuters', 'wsj', 'press', 'bbc', 'times', 'financial', 'post']
    if is_verified or any(kw in channel_name for kw in media_keywords):
        return 2
        
    return 3

def get_broll_query_fallback(entity, query_text):
    """
    Generates a universal B-roll search query dynamically from the entity/subject name
    without ANY hardcoded brand names or founder names.
    """
    subject = entity.strip() if entity else (query_text.split()[0] if query_text else "Official")
    
    # Universal Formula: [Subject/Entity] + [Universal High-Quality B-Roll & Keynote Suffixes]
    primary_broll_query = f"{subject} official keynote presentation footage B-roll"
    keywords = [subject.lower(), "keynote", "presentation", "official", "footage"]
    
    return primary_broll_query, keywords

def search_and_evaluate(yt_dlp_bin, query, keywords, entity, out_dir, date_filter=None):
    """Executes YouTube search and returns best candidate metadata + time window."""
    temp_dir = os.path.join(out_dir, ".temp")
    os.makedirs(temp_dir, exist_ok=True)

    search_cmd = [
        yt_dlp_bin,
        f"ytsearch5:{query}",
        "--dump-json",
        "--default-search", "ytsearch",
        "--no-playlist",
        "--flat-playlist"
    ]
    
    if date_filter:
        search_cmd.extend(["--dateafter", date_filter])

    try:
        res = subprocess.run(search_cmd, capture_output=True, text=True, check=True)
        results = [json.loads(line) for line in res.stdout.strip().split('\n') if line.strip()]
    except Exception:
        return None

    if not results:
        return None

    for r in results:
        r['priority'] = classify_channel(r, entity)
    
    results.sort(key=lambda x: x['priority'])
    
    for candidate in results:
        video_url = candidate.get('url') or f"https://www.youtube.com/watch?v={candidate.get('id')}"
        video_id = candidate.get('id')
        
        vtt_prefix = os.path.join(temp_dir, f"sub_{video_id}")
        sub_cmd = [
            yt_dlp_bin,
            video_url,
            "--write-auto-subs",
            "--sub-lang", "en,id",
            "--skip-download",
            "-o", vtt_prefix
        ]
        
        subprocess.run(sub_cmd, capture_output=True, text=True)
        
        vtt_file = None
        for f_name in os.listdir(temp_dir):
            if f_name.startswith(f"sub_{video_id}") and f_name.endswith('.vtt'):
                vtt_file = os.path.join(temp_dir, f_name)
                break
                
        if not vtt_file:
            # In Pass 2 (B-roll), subtitles might be absent: select default 00:10 to 00:55
            if date_filter is None:
                return {
                    "video_url": video_url,
                    "video_title": candidate.get('title'),
                    "channel": candidate.get('uploader'),
                    "start_sec": 10,
                    "end_sec": 55,
                    "score": 1
                }
            continue
            
        entries = parse_vtt_timestamps(vtt_file)
        start_sec, end_sec, score = find_best_time_window(entries, keywords)
        
        # Pass 1 requires a positive keyword score (>0); Pass 2 accepts any clean window
        if start_sec is not None and end_sec is not None and (end_sec - start_sec) >= 20:
            if date_filter and score == 0:
                continue
            return {
                "video_url": video_url,
                "video_title": candidate.get('title'),
                "channel": candidate.get('uploader'),
                "start_sec": start_sec,
                "end_sec": end_sec,
                "score": score
            }

    return None

def main():
    parser = argparse.ArgumentParser(description="YouTube 2-Pass Clip Finder (Recent News -> Iconic B-Roll Fallback)")
    parser.add_argument("--query", required=True, help="Primary news search query")
    parser.add_argument("--keywords", required=True, help="Comma-separated keywords")
    parser.add_argument("--entity", default="", help="Primary subject/entity name")
    parser.add_argument("--output-id", required=True, help="Base output filename ID")
    parser.add_argument("--out-dir", default="/mnt/data/Obsidian Docs/Image Prompt Db/Sosmed-Pipeline/x-pipeline/00-Media-Vault", help="Output directory")

    args = parser.parse_args()
    os.makedirs(args.out_dir, exist_ok=True)
    final_output_mp4 = os.path.join(args.out_dir, f"{args.output_id}.mp4")
    
    yt_dlp_bin = "/home/silvester/.local/bin/yt-dlp"
    if not os.path.exists(yt_dlp_bin):
        yt_dlp_bin = "yt-dlp"

    kw_list = [k.strip() for k in args.keywords.split(',') if k.strip()]

    # PASS 1: Search Recent News (<7 Days Old)
    seven_days_ago = (datetime.now() - timedelta(days=7)).strftime("%Y%m%d")
    clip_info = search_and_evaluate(yt_dlp_bin, args.query, kw_list, args.entity, args.out_dir, date_filter=seven_days_ago)
    clip_type = "realtime_news"

    # PASS 2: Iconic B-Roll Fallback (If no <7-day video found)
    if not clip_info:
        broll_query, broll_keywords = get_broll_query_fallback(args.entity, args.query)
        clip_info = search_and_evaluate(yt_dlp_bin, broll_query, broll_keywords, args.entity, args.out_dir, date_filter=None)
        clip_type = "iconic_broll"

    if not clip_info:
        print(json.dumps({"status": "none", "message": "No real-time news or iconic B-roll video match found"}, indent=2))
        return

    # Execute Section Cut
    start_tc = format_seconds_to_tc(clip_info['start_sec'])
    end_tc = format_seconds_to_tc(clip_info['end_sec'])
    section_str = f"*{start_tc}-{end_tc}"

    cut_cmd = [
        yt_dlp_bin,
        clip_info['video_url'],
        "--download-sections", section_str,
        "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "--force-keyframes-at-cuts",
        "-o", final_output_mp4,
        "--no-playlist"
    ]

    try:
        subprocess.run(cut_cmd, capture_output=True, text=True, check=True)
    except Exception as e:
        print(json.dumps({"status": "error", "message": f"Clipping failed: {str(e)}"}, indent=2))
        return

    result = {
        "status": "success",
        "clip_type": clip_type,
        "media_path": final_output_mp4,
        "obsidian_embed": f"![[00-Media-Vault/{args.output_id}.mp4]]",
        "timestamp_range": f"{start_tc} - {end_tc}",
        "video_title": clip_info['video_title'],
        "channel": clip_info['channel'],
        "source_url": clip_info['video_url']
    }
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
