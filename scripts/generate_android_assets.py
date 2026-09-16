import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_icon(size=512, is_foreground_only=False, is_round=False):
    # Supersample 4x for ultra-sharp anti-aliased geometry
    ss = 4
    canvas_size = size * ss
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx = canvas_size / 2.0
    cy = canvas_size / 2.0

    if not is_foreground_only:
        # Background: Dark obsidian base
        if is_round:
            # Round icon
            draw.ellipse([0, 0, canvas_size, canvas_size], fill=(10, 13, 20, 255))
        else:
            # Rounded squircle
            corner_radius = int(canvas_size * 0.22)
            draw.rounded_rectangle([0, 0, canvas_size, canvas_size], radius=corner_radius, fill=(10, 13, 20, 255))
            # Subtle outer neon border
            draw.rounded_rectangle([ss * 2, ss * 2, canvas_size - ss * 2, canvas_size - ss * 2], 
                                   radius=corner_radius - ss, 
                                   outline=(0, 245, 155, 60), width=ss * 3)

    # Scale factors relative to 512 master (if foreground_only, scale to 72% safe zone)
    content_scale = 0.68 if is_foreground_only else 0.88
    r_core = (canvas_size * 0.42) * content_scale

    # Outer Plate Rim
    draw.ellipse([cx - r_core, cy - r_core, cx + r_core, cy + r_core], 
                 fill=(12, 16, 26, 255), outline=(255, 255, 255, 20), width=int(10 * ss * content_scale))

    # Cyan / Volt dashed inner ring
    r_dash = r_core * 0.88
    dash_count = 36
    for i in range(dash_count):
        if i % 2 == 0:
            a_start = math.radians(i * (360 / dash_count))
            a_end = math.radians((i + 0.7) * (360 / dash_count))
            # Draw arc
            pts = []
            steps = 10
            for s in range(steps + 1):
                ang = a_start + (a_end - a_start) * (s / steps)
                pts.append((cx + r_dash * math.cos(ang), cy + r_dash * math.sin(ang)))
            draw.line(pts, fill=(0, 245, 155, 160), width=int(4 * ss * content_scale))

    # Hexagonal Core Plate
    r_hex = r_core * 0.72
    hex_pts = []
    for i in range(6):
        ang = math.radians(i * 60 - 30)
        hex_pts.append((cx + r_hex * math.cos(ang), cy + r_hex * math.sin(ang)))
    draw.polygon(hex_pts, fill=(19, 26, 38, 255), outline=(0, 229, 255, 120))

    # Central Dumbbell Weights
    w_scale = content_scale * ss
    # Center knurled handle
    handle_w = int(120 * w_scale)
    handle_h = int(22 * w_scale)
    hx0 = cx - handle_w / 2.0
    hy0 = cy - handle_h / 2.0
    draw.rounded_rectangle([hx0, hy0, hx0 + handle_w, hy0 + handle_h], radius=int(6 * w_scale), fill=(240, 245, 255, 255))

    # Knurling notches on handle
    notch_count = 7
    notch_spacing = handle_w / (notch_count + 1)
    for n in range(1, notch_count + 1):
        nx = hx0 + n * notch_spacing
        draw.line([(nx, hy0), (nx, hy0 + handle_h)], fill=(10, 13, 20, 255), width=int(3 * w_scale))

    # Left Weight Plates (Outer volt, Inner cyan)
    p1_w = int(24 * w_scale)
    p1_h = int(126 * w_scale)
    p1_x = hx0 - int(44 * w_scale)
    p1_y = cy - p1_h / 2.0
    draw.rounded_rectangle([p1_x, p1_y, p1_x + p1_w, p1_y + p1_h], radius=int(8 * w_scale), fill=(0, 245, 155, 255))

    p2_w = int(18 * w_scale)
    p2_h = int(88 * w_scale)
    p2_x = hx0 - int(16 * w_scale)
    p2_y = cy - p2_h / 2.0
    draw.rounded_rectangle([p2_x, p2_y, p2_x + p2_w, p2_y + p2_h], radius=int(6 * w_scale), fill=(0, 229, 255, 255))

    # Right Weight Plates (Inner cyan, Outer volt)
    p3_w = int(18 * w_scale)
    p3_h = int(88 * w_scale)
    p3_x = hx0 + handle_w - int(2 * w_scale)
    p3_y = cy - p3_h / 2.0
    draw.rounded_rectangle([p3_x, p3_y, p3_x + p3_w, p3_y + p3_h], radius=int(6 * w_scale), fill=(0, 229, 255, 255))

    p4_w = int(24 * w_scale)
    p4_h = int(126 * w_scale)
    p4_x = hx0 + handle_w + int(20 * w_scale)
    p4_y = cy - p4_h / 2.0
    draw.rounded_rectangle([p4_x, p4_y, p4_x + p4_w, p4_y + p4_h], radius=int(8 * w_scale), fill=(0, 245, 155, 255))

    # Dynamic Overload Lightning Bolt across top of core
    bolt_pts = [
        (cx + 12 * w_scale, cy - 124 * w_scale),
        (cx - 24 * w_scale, cy - 48 * w_scale),
        (cx + 6 * w_scale, cy - 48 * w_scale),
        (cx - 14 * w_scale, cy + 12 * w_scale),
        (cx + 28 * w_scale, cy - 62 * w_scale),
        (cx - 2 * w_scale, cy - 62 * w_scale),
    ]
    draw.polygon(bolt_pts, fill=(0, 245, 155, 255))

    # Downsample with high-quality Lanczos filter
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

def create_splash(width=1080, height=1920):
    # High-res vertical splash
    img = Image.new("RGBA", (width, height), (10, 13, 20, 255))
    draw = ImageDraw.Draw(img)

    # Subtle radial glow in upper-center
    cx = width / 2.0
    cy = height * 0.44

    # Center icon (260x260)
    icon = create_icon(size=260, is_foreground_only=False, is_round=False)
    ix = int(cx - 130)
    iy = int(cy - 130)
    img.paste(icon, (ix, iy), icon)

    # App Title "OVERLOAD AI"
    # Draw text or geometry
    title_y = int(cy + 170)
    # Subtitle
    sub_y = int(cy + 220)

    # Let's use Pillow default font or draw stylized text
    try:
        font_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 46)
        font_sub = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 20)
    except:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    # Draw centered text
    text_title = "OVERLOAD AI"
    bbox_t = draw.textbbox((0, 0), text_title, font=font_title)
    tw = bbox_t[2] - bbox_t[0]
    draw.text((cx - tw / 2.0, title_y), text_title, fill=(255, 255, 255, 255), font=font_title)

    text_sub = "HYPERTROPHY & PROGRESSIVE OVERLOAD"
    bbox_s = draw.textbbox((0, 0), text_sub, font=font_sub)
    sw = bbox_s[2] - bbox_s[0]
    draw.text((cx - sw / 2.0, sub_y), text_sub, fill=(0, 229, 255, 220), font=font_sub)

    return img

def create_feature_graphic(width=1024, height=500):
    img = Image.new("RGBA", (width, height), (7, 9, 14, 255))
    draw = ImageDraw.Draw(img)

    # Gradient glow on left
    for r in range(300, 0, -5):
        alpha = int(35 * (1 - r / 300))
        draw.ellipse([180 - r, 250 - r, 180 + r, 250 + r], fill=(0, 229, 255, alpha))

    # Icon on left
    icon = create_icon(size=240, is_foreground_only=False, is_round=False)
    img.paste(icon, (60, 130), icon)

    # Right side typography
    try:
        font_brand = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 52)
        font_tagline = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 24)
        font_pill = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 16)
    except:
        font_brand = ImageFont.load_default()
        font_tagline = ImageFont.load_default()
        font_pill = ImageFont.load_default()

    # Brand Title
    draw.text((340, 130), "OVERLOAD AI", fill=(255, 255, 255, 255), font=font_brand)
    draw.text((340, 195), "The Smart Hypertrophy & Progressive Overload Tracker", fill=(0, 245, 155, 255), font=font_tagline)

    # Feature badges
    badges = [
        "•  1,500+ Clean Video Visuals (No Watermarks)",
        "•  Autonomous Gemini AI Strength Coach",
        "•  Live MAV / MRV Volume Landmarks",
        "•  100% Offline Gym Logging & Storage"
    ]
    by = 260
    for b in badges:
        draw.rounded_rectangle([340, by, 720, by + 34], radius=8, fill=(18, 24, 36, 255), outline=(0, 229, 255, 60))
        draw.text((356, by + 7), b, fill=(240, 245, 255, 255), font=font_pill)
        by += 46

    return img

if __name__ == "__main__":
    os.makedirs("play-store-assets", exist_ok=True)
    
    # 1. Google Play Console Marketing Icon (512x512 PNG, no transparency allowed by Google)
    icon_512 = create_icon(512, is_foreground_only=False, is_round=False)
    # Flatten on solid #0A0D14
    solid_512 = Image.new("RGB", (512, 512), (10, 13, 20))
    solid_512.paste(icon_512, (0, 0), icon_512)
    solid_512.save("play-store-assets/icon-512.png", "PNG")
    print("Saved play-store-assets/icon-512.png")

    # 2. Google Play Feature Graphic (1024x500 PNG)
    feature = create_feature_graphic(1024, 500)
    solid_feature = Image.new("RGB", (1024, 500), (7, 9, 14))
    solid_feature.paste(feature, (0, 0), feature)
    solid_feature.save("play-store-assets/feature-graphic-1024x500.png", "PNG")
    print("Saved play-store-assets/feature-graphic-1024x500.png")

    # 3. Android Adaptive Foregrounds & Mipmaps
    densities = {
        "mdpi": {"icon": 48, "fg": 108},
        "hdpi": {"icon": 72, "fg": 162},
        "xhdpi": {"icon": 96, "fg": 216},
        "xxhdpi": {"icon": 144, "fg": 324},
        "xxxhdpi": {"icon": 192, "fg": 432}
    }

    res_dir = "android/app/src/main/res"
    for d, sizes in densities.items():
        folder = os.path.join(res_dir, f"mipmap-{d}")
        os.makedirs(folder, exist_ok=True)

        # Foreground for adaptive icons (with safe margin)
        fg = create_icon(sizes["fg"], is_foreground_only=True)
        fg.save(os.path.join(folder, "ic_launcher_foreground.png"), "PNG")

        # Standard icon (squircle)
        sq = create_icon(sizes["icon"], is_foreground_only=False, is_round=False)
        sq.save(os.path.join(folder, "ic_launcher.png"), "PNG")

        # Round icon
        rd = create_icon(sizes["icon"], is_foreground_only=False, is_round=True)
        rd.save(os.path.join(folder, "ic_launcher_round.png"), "PNG")

        print(f"Generated mipmap-{d} icons (icon={sizes['icon']}px, fg={sizes['fg']}px)")

    # 4. Splash screens
    splash_portrait = create_splash(1080, 1920)
    splash_portrait.save(os.path.join(res_dir, "drawable", "splash.png"), "PNG")
    
    # Save to port density folders if they exist
    port_densities = {
        "drawable-port-mdpi": (320, 480),
        "drawable-port-hdpi": (480, 800),
        "drawable-port-xhdpi": (720, 1280),
        "drawable-port-xxhdpi": (960, 1600),
        "drawable-port-xxxhdpi": (1280, 1920)
    }
    for folder_name, (w, h) in port_densities.items():
        fpath = os.path.join(res_dir, folder_name)
        if os.path.exists(fpath):
            sp = create_splash(w, h)
            sp.save(os.path.join(fpath, "splash.png"), "PNG")
            print(f"Generated splash for {folder_name} ({w}x{h})")

    print("All Android branding assets successfully generated!")
