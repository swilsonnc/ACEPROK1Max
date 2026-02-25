# ACEPROK1Max ACE Dashboard - Web Interface for ACE Management

A modern web interface for managing and monitoring the Anycubic Color Engine Pro via the Moonraker API.

Credits go to ValgACE for creating this dashboard initially.

## Description

ACEPROK1Max ACE Dashboard is a fully functional web interface that provides:

- ✅ **Status Monitoring** - Displays device status in real time
- ✅ **Slot Management** - Loads/unloads filament, parks it on the hotend, color, type and temp change
- ✅ **Feed Assist** - Enables/disables feed assist for each slot with visual status indication
- ✅ **Drying Control** - Starts and stops filament drying
- ✅ **Filament Feed/Retract** - Manually controls feed and retract
- ✅ **WebSocket Connection** - Real-time status updates
- ✅ **Responsive Design** - Works on desktop and mobile devices
- ✅ **Language Switching** - Built-in switch between Russian and English interfaces

## Files

- `ace-dashboard.html` - the main HTML file with the Vue.js component
- `ace-dashboard.css` - interface styles
- `ace-dashboard.js` - API and WebSocket logic
- `ace-dashboard-config.js` - configuration file for setting up the Moonraker address
- `nginx.conf.example` - example nginx configuration for hosting

## Installation

### Option 1: Local file (for testing)

1. Copy all files to one folder:
```bash
mkdir -p ~/ace-dashboard
cp ~/ACEPROK1Max/ace-dashboard/ace-dashboard.* ~/ace-dashboard/
```

2. Open `ace-dashboard.html` in a browser via the web server (not via `file://`)

**Important:** To work via `file://`, you need to configure CORS or use a web server.

### Option 2: Integration with Mainsail/Fluidd

#### For Mainsail:

1. Copy the files to the Mainsail folder:
```bash
cp ace-dashboard.html ~/mainsail/src/dashboard/
cp ace-dashboard.css ~/mainsail/src/dashboard/
cp ace-dashboard.js ~/mainsail/src/dashboard/
```

2. Add a link to the Mainsail navigation (requires source code modification)

#### For Fluidd:

1. Copy the files to the Fluidd folder:
```bash
cp ace-dashboard.html ~/fluidd/dist/
cp ace-dashboard.css ~/fluidd/dist/
cp ace-dashboard.js ~/fluidd/dist/
```

2. Add a link to the Fluidd navigation

### Option 3: A separate web server

1. Install a simple HTTP server:
```bash
# Python 3
python3 -m http.server 8080

# Or Node.js
npx http-server -p 8080
```

2. Open in a browser: `http://localhost:8080/ace-dashboard.html`

### Option 3: Nginx (recommended for permanent use)

1. Copy the files to the web server directory:
```bash
sudo cp ace-dashboard.* /var/www/ace-dashboard/
```

2. Use the example configuration from `nginx.conf.example`:
```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/ace-dashboard
sudo nano /etc/nginx/sites-available/ace-dashboard # Edit the paths
sudo ln -s /etc/nginx/sites-available/ace-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

See the commented `nginx.conf.example` for more details.

## Usage

### Connection

The interface automatically connects to the Moonraker API at the current host address. If you're opening the file locally, make sure:

1. Moonraker is running and accessible
2. The `ace_status.py` component is installed and loaded
3. The browser can access the Moonraker API (CORS is configured)

### Configuring the API URL

Edit the `ace-dashboard-config.js` file:

``javascript
const ACE_DASHBOARD_CONFIG = {
// Specify the Moonraker API URL
apiBase: 'http://192.168.1.100:7125', // Your Moonraker IP address

// Or use automatic detection (default)
// apiBase: window.location.origin,

// Other settings...
};
```

See the comments in the `ace-dashboard-config.js` file for details.

### Main Features

#### Status Monitoring

- Device status is displayed at the top of the interface
- Connection indicator shows the WebSocket connection status
- Automatically updates every 5 seconds

#### Slot Management
- Can click on the color of the slot and change it's color
- Can change the type of filament
- Can change the temp of the filament
- **Load** - loads filament from a slot (executes `ACE_CHANGE_TOOL`)
- **Park** - parks filament to the hotend (executes `ACE_PARK_TO_TOOLHEAD`)
- **Assist** - enables/disables feed assist for a slot (`ACE_ENABLE_FEED_ASSIST` / `ACE_DISABLE_FEED_ASSIST`)
- Green button with the text "Assist ON" when feed assist is active for this slot
- Green button with the text "Assist" when inactive
- Enabling a new slot automatically disables the previous one
- **Feed** - opens a dialog for feeding filament to set length
- **Unroll** - Opens a dialog for unrolling the filament to a set length

#### Drying Control

1. Set the target temperature (20-60°C)
2. Set the drying duration (in minutes)
3. Click "Start Drying"
4. To stop, click "Stop"

#### Quick Actions

- **Unload Filament** - Unloads the current filament (`ACE_CHANGE_TOOL TOOL=-1`)
- **Refresh Status** - Forces a device status update

## API Endpoint
