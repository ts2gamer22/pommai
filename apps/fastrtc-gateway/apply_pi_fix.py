#!/usr/bin/env python3
"""
Script to fix the WebSocket URL construction in Raspberry Pi's fastrtc_connection.py
Run this on your Raspberry Pi to apply the fix.
"""

import sys
import os

def apply_fix(file_path):
    """Apply the WebSocket URL construction fix"""
    
    # Read the file
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    # Find and replace the relevant section
    modified = False
    for i in range(len(lines)):
        # Look for the line where we connect to the gateway
        if 'logger.info(f"Connecting to FastRTC gateway at {self.config.gateway_url}")' in lines[i]:
            # Replace the logging line and add URL construction
            lines[i] = '''            # Build the complete WebSocket URL with device_id and toy_id
            # The server expects: /ws/{device_id}/{toy_id}
            ws_url = f"{self.config.gateway_url}/{self.config.device_id}/{self.config.toy_id}"
            
            logger.info(f"Connecting to FastRTC gateway at {ws_url}")
'''
            modified = True
        
        # Replace the websockets.connect line
        elif 'self.config.gateway_url,' in lines[i] and 'await websockets.connect' in lines[i-1]:
            lines[i] = '                ws_url,  # Use the constructed URL with device_id and toy_id\n'
            modified = True
    
    if not modified:
        print("WARNING: Could not find the exact lines to modify. Manual fix may be needed.")
        return False
    
    # Write the fixed file
    with open(file_path, 'w') as f:
        f.writelines(lines)
    
    print(f"✅ Successfully fixed {file_path}")
    return True

if __name__ == "__main__":
    # Default path on Raspberry Pi
    default_path = "/home/pi/pommai-client/src/fastrtc_connection.py"
    
    # Allow custom path as argument
    file_path = sys.argv[1] if len(sys.argv) > 1 else default_path
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        print("Please provide the correct path to fastrtc_connection.py")
        sys.exit(1)
    
    # Create backup
    backup_path = file_path + ".backup"
    with open(file_path, 'r') as f:
        backup_content = f.read()
    with open(backup_path, 'w') as f:
        f.write(backup_content)
    print(f"📁 Created backup at {backup_path}")
    
    # Apply the fix
    if apply_fix(file_path):
        print("\n✨ Fix applied successfully!")
        print("\nMake sure your Pi's .env file has:")
        print("  FASTRTC_GATEWAY_URL=ws://192.168.1.11:8080/ws")
        print("  DEVICE_ID=rpi-zero2w-001")
        print("  TOY_ID=kd729cad81984f52pz1v1f3gh57q3774")
    else:
        print("\n❌ Fix failed. Restoring backup...")
        with open(backup_path, 'r') as f:
            original = f.read()
        with open(file_path, 'w') as f:
            f.write(original)
        print("Backup restored. Please apply the fix manually.")
