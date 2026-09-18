import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_play_store_screenshot(
    source_img_path: str,
    output_path: str,
    tag: str,
    headline: str,
    subtitle: str,
    feature_badges: list,
    accent_color: str = "#00F59B"
):
    W, H = 1080, 1920
    canvas = Image.new("RGBA", (W, H), "#07090E")
    draw = ImageDraw.Draw(canvas)

    # Ambient radial gradient glow at top
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    
    h = accent_color.lstrip('#')
    rgb = tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
    
    for r in range(450, 0, -25):
        alpha = int(40 * (1 - r / 450.0))
        glow_draw.ellipse([W//2 - r, 70 - r//2, W//2 + r, 70 + r], fill=(*rgb, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(55))
    canvas.paste(glow, (0, 0), glow)

    # Fonts
    font_dir = os.path.join(os.environ.get('WINDIR', 'C:\\Windows'), 'Fonts')
    font_tag = ImageFont.truetype(os.path.join(font_dir, 'segoeuib.ttf'), 26)
    font_title = ImageFont.truetype(os.path.join(font_dir, 'segoeuib.ttf'), 46)
    font_sub = ImageFont.truetype(os.path.join(font_dir, 'segoeui.ttf'), 26)
    font_badge = ImageFont.truetype(os.path.join(font_dir, 'segoeuib.ttf'), 22)

    # 1. Header Text Rendering
    tag_text = f"• {tag.upper()} •"
    tag_bbox = draw.textbbox((0, 0), tag_text, font=font_tag)
    tag_w = tag_bbox[2] - tag_bbox[0]
    draw.text(((W - tag_w) // 2, 55), tag_text, font=font_tag, fill=accent_color)

    title_bbox = draw.textbbox((0, 0), headline, font=font_title)
    title_w = title_bbox[2] - title_bbox[0]
    draw.text(((W - title_w) // 2, 98), headline, font=font_title, fill="#FFFFFF")

    sub_bbox = draw.textbbox((0, 0), subtitle, font=font_sub)
    sub_w = sub_bbox[2] - sub_bbox[0]
    draw.text(((W - sub_w) // 2, 162), subtitle, font=font_sub, fill="#94A3B8")

    # 2. Source Image Processing
    src = Image.open(source_img_path).convert("RGBA")
    
    # Target inner width: 840px
    inner_w = 840
    scale = inner_w / src.width
    inner_h = int(src.height * scale) # ~1208px
    
    # Scale screenshot with high quality resampling
    resized_src = src.resize((inner_w, inner_h), Image.Resampling.LANCZOS)

    # Device Mock Frame dimensions
    pad_side = 12
    pad_top = 14
    pad_bottom = 46 # chin with home gesture bar
    
    frame_w = inner_w + (pad_side * 2) # 864px
    frame_h = inner_h + pad_top + pad_bottom
    frame_x = (W - frame_w) // 2
    frame_y = 215
    radius = 40

    # Drop shadow for device frame
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle(
        [frame_x - 8, frame_y - 4, frame_x + frame_w + 8, frame_y + frame_h + 8],
        radius=radius + 4,
        fill=(0, 0, 0, 190)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(30))
    canvas.paste(shadow, (0, 0), shadow)

    # Outer device bezel
    draw.rounded_rectangle(
        [frame_x, frame_y, frame_x + frame_w, frame_y + frame_h],
        radius=radius,
        fill="#0D111A",
        outline=(255, 255, 255, 45),
        width=3
    )

    # Top camera pill indicator
    camera_w = 70
    camera_h = 6
    draw.rounded_rectangle(
        [(W - camera_w)//2, frame_y + 4, (W + camera_w)//2, frame_y + 4 + camera_h],
        radius=3,
        fill=(255, 255, 255, 60)
    )

    # Rounded corners mask for inner screenshot
    mask = Image.new("L", (inner_w, inner_h), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(
        [0, 0, inner_w, inner_h],
        radius=radius - 12,
        fill=255
    )

    canvas.paste(resized_src, (frame_x + pad_side, frame_y + pad_top), mask)

    # Android Home Gesture Navigation Bar at bottom of chin
    chin_y = frame_y + pad_top + inner_h + 18
    nav_w = 160
    draw.rounded_rectangle(
        [(W - nav_w)//2, chin_y, (W + nav_w)//2, chin_y + 5],
        radius=3,
        fill=(255, 255, 255, 90)
    )

    # Top accent hairline glow on frame
    draw.rounded_rectangle(
        [frame_x + 90, frame_y, frame_x + frame_w - 90, frame_y + 2],
        radius=1,
        fill=accent_color
    )

    # 3. Bottom Feature Badges Bar
    badge_y = frame_y + frame_h + 24
    if badge_y < H - 55:
        # Calculate total width for centered badges
        badge_boxes = []
        for b_text in feature_badges:
            b_bbox = draw.textbbox((0, 0), b_text, font=font_badge)
            bw = (b_bbox[2] - b_bbox[0]) + 30
            badge_boxes.append((b_text, bw))
        
        gap = 14
        total_w = sum(bw for _, bw in badge_boxes) + gap * (len(badge_boxes) - 1)
        curr_x = (W - total_w) // 2
        
        for b_text, bw in badge_boxes:
            draw.rounded_rectangle(
                [curr_x, badge_y, curr_x + bw, badge_y + 42],
                radius=21,
                fill=(18, 24, 38, 230),
                outline=(255, 255, 255, 30),
                width=1
            )
            # Text
            b_bbox = draw.textbbox((0, 0), b_text, font=font_badge)
            tw = b_bbox[2] - b_bbox[0]
            draw.text((curr_x + (bw - tw)//2, badge_y + 9), b_text, font=font_badge, fill="#E2E8F0")
            curr_x += bw + gap

    final = canvas.convert("RGB")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    final.save(output_path, "PNG", optimize=True)
    print(f"Generated: {output_path} ({W}x{H})")

if __name__ == "__main__":
    artifacts_dir = r"C:\Users\ojeri\.gemini\antigravity-ide\brain\2a9314da-6f3b-4fe1-9502-d88402700de5"
    out_dir = r"C:\my stuff\Git Hub Projects\Gym_app\play-store-assets\screenshots"
    
    screens = [
        {
            "src": os.path.join(artifacts_dir, "dashboard_metric_kg_1789565382658.png"),
            "out": os.path.join(out_dir, "01_progressive_overload_dashboard.png"),
            "tag": "Intelligent Hypertrophy Engine",
            "headline": "SMART PROGRESSIVE OVERLOAD",
            "subtitle": "Auto-calculated targets for weights, reps, and RPE",
            "badges": ["Targeted RIR", "Periodized Blocks", "Mechanical Tension"],
            "accent": "#00F59B"
        },
        {
            "src": os.path.join(artifacts_dir, "exercise_picker_library_1789474221171.png"),
            "out": os.path.join(out_dir, "02_exercise_library.png"),
            "tag": "Form Demonstrations",
            "headline": "1,515+ EXERCISE VISUAL GUIDES",
            "subtitle": "High-res unwatermarked animations with muscle badges",
            "badges": ["Anatomical Focus", "Equipment Filters", "Biomechanical Cues"],
            "accent": "#00E5FF"
        },
        {
            "src": os.path.join(artifacts_dir, "pro_coach_view_1789564134837.png"),
            "out": os.path.join(out_dir, "03_gemini_ai_coach.png"),
            "tag": "Powered by Gemini AI",
            "headline": "AUTONOMOUS AI COACH",
            "subtitle": "Instant biomechanical guidance & smart exercise swaps",
            "badges": ["Real-Time Guidance", "Joint-Safe Swaps", "Volume Tuning"],
            "accent": "#FFB800"
        },
        {
            "src": os.path.join(artifacts_dir, "routines_view_1789564025867.png"),
            "out": os.path.join(out_dir, "04_custom_routines.png"),
            "tag": "Structured Periodization",
            "headline": "UNLIMITED CUSTOM ROUTINES",
            "subtitle": "Build and run custom splits, PPL, Arnold, and Upper/Lower",
            "badges": ["PPL & Arnold Splits", "Mesocycle Tracking", "Auto Rest Timers"],
            "accent": "#A78BFA"
        },
        {
            "src": os.path.join(artifacts_dir, "paywall_gbp_pricing_1789565408866.png"),
            "out": os.path.join(out_dir, "05_volume_landmarks.png"),
            "tag": "Scientific Periodization",
            "headline": "VOLUME LANDMARKS & FATIGUE",
            "subtitle": "Track MEV, MAV, and MRV to eliminate plateaus",
            "badges": ["MEV / MAV / MRV", "Fatigue Monitoring", "Deload Automation"],
            "accent": "#00F59B"
        },
        {
            "src": os.path.join(artifacts_dir, "settings_modal_membership_1789563964608.png"),
            "out": os.path.join(out_dir, "06_offline_first_privacy.png"),
            "tag": "Zero Tracking",
            "headline": "100% OFFLINE-FIRST PRIVACY",
            "subtitle": "No mandatory account • Encrypted on your device",
            "badges": ["IndexedDB Encrypted", "No Forced Accounts", "Instant CSV Export"],
            "accent": "#00E5FF"
        }
    ]

    for s in screens:
        if os.path.exists(s["src"]):
            create_play_store_screenshot(
                s["src"], s["out"], s["tag"], s["headline"], s["subtitle"], s["badges"], s["accent"]
            )
