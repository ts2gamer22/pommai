# Enabling mDNS (.local hostnames) for Pommai Gateway

Use mDNS to avoid changing IPs in FASTRTC_GATEWAY_URL. With mDNS, the gateway is addressable as <hostname>.local (for example, pommai-gateway.local).

Contents
- What is mDNS?
- Windows setup
- macOS setup
- Linux setup (Ubuntu/Debian/RPi OS)
- Verify mDNS resolution
- Update the Pi .env
- Notes for Docker networking and firewalls

What is mDNS?
mDNS (Multicast DNS) lets devices resolve hostnames ending in .local on the local network without a central DNS server.

Windows setup
1) Ensure mDNS is enabled (Windows 10/11)
   - Windows 10/11 have native mDNS support. Make sure these services are running (Win+R → services.msc):
     - Function Discovery Provider Host (fdPHost): Startup type = Automatic (Delayed Start)
     - Function Discovery Resource Publication (FDResPub): Startup type = Automatic (Delayed Start)
   - Start both services if they aren’t running.
2) Allow inbound mDNS and gateway port in Windows Firewall
   - mDNS uses UDP 5353. Gateway uses TCP 8080 (default).
   - PowerShell (Admin):
     - New-NetFirewallRule -DisplayName "mDNS (UDP 5353)" -Direction Inbound -Protocol UDP -LocalPort 5353 -Action Allow
     - New-NetFirewallRule -DisplayName "Pommai FastRTC 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
3) Optional: Bonjour
   - If discovery is inconsistent, install Apple Bonjour Print Services to improve compatibility.

macOS setup
- mDNS is built in (Bonjour). No install needed.
- Allow the gateway port through the macOS firewall (System Settings → Network → Firewall → Options → Add Python/Docker or open TCP 8080).

Linux setup (Ubuntu/Debian/Raspberry Pi OS)
1) Install Avahi (mDNS responder)
   - sudo apt update && sudo apt install -y avahi-daemon avahi-utils
2) Enable and start Avahi
   - sudo systemctl enable avahi-daemon
   - sudo systemctl start avahi-daemon
3) Hostname
   - The machine’s hostname will be accessible as <hostname>.local.
   - Check: hostnamectl; change with: sudo hostnamectl set-hostname pommai-gateway

Verify mDNS resolution
- From the Pi (or any LAN host):
  - ping pommai-gateway.local
  - avahi-resolve -n pommai-gateway.local    # on Linux
  - nslookup pommai-gateway.local            # on Windows/macOS may rely on mDNS
- Test gateway health:
  - curl http://pommai-gateway.local:8080/health

Update the Pi .env
- Edit /home/pommai/app/.env:
  - FASTRTC_GATEWAY_URL=ws://pommai-gateway.local:8080/ws/rpi-zero2w-001/<YOUR_TOY_ID>
- Restart service:
  - sudo systemctl restart pommai

Notes for Docker networking and firewalls
- Ensure the relay container publishes the port:
  - In docker-compose.relay.yml: ports: ["8080:8080"], HOST=0.0.0.0, PORT=8080
- Windows/macOS: allow inbound TCP 8080 in the host OS firewall.
- If you run Docker Desktop, ensure no other process blocks 8080.
- mDNS advertises the HOSTNAME of the host machine. The container doesn’t need its own .local name; the host’s .local with port mapping is sufficient.

Troubleshooting
- If .local resolution intermittently fails on Windows, verify FDResPub and fdPHost are running and not blocked by corporate policies.
- Some routers/APs isolate clients or block multicast. Disable “AP Isolation” and ensure multicast is allowed.
- On Linux, verify avahi-daemon status: systemctl status avahi-daemon; logs: journalctl -u avahi-daemon -f
