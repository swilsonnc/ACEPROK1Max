// ACEPROK1Max Dashboard JavaScript

const { createApp } = Vue;

createApp({
    data() {
        return {
            currentLanguage: 'en',
            translations: {
                en: {
                    header: {
                        title: '🎨 ACEPROK1Max Control Panel',
                        connectionLabel: 'Status',
                        connected: 'Connected',
                        disconnected: 'Disconnected'
                    },
                    cards: {
                        deviceStatus: 'Device Status',
                        dryer: 'Dryer Control',
                        slots: 'Filament Slots',
                        quickActions: 'Quick Actions'
                    },
                    deviceInfo: {
                        model: 'ACE Model',
                        firmware: 'ACE Firmware',
                        boot_firmware: 'ACE Boot_Firmware',
                        status: 'Status',
                        filament_pos: 'Filament Position',
                        current_index: 'Current Slot',
                        temp: 'Temperature',
                        fan: 'Fan Speed',
                        rfid: 'RFID',
                        rfidOn: 'Enabled',
                        rfidOff: 'Disabled'
                    },
                    dryer: {
                        status: 'Status',
                        targetTemp: 'Target Temperature',
                        duration: 'Set Duration',
                        remainingTime: 'Remaining Time',
                        currentTemperature: 'Current Temperature',
                        inputs: {
                            temp: 'Temperature (°C):',
                            duration: 'Duration (min):'
                        },
                        buttons: {
                            start: 'Start Drying',
                            stop: 'Stop Drying'
                        }
                    },
                    slots: {
                        slot: 'Slot',
                        status: 'Status',
                        type: 'Type',
                        temp: 'Temp',
                        sku: 'SKU',
                        rfid: 'RFID'
                    },
                    quickActions: {
                        unload: 'Unload Filament',
                        stopAssist: 'Stop Assist',
                        refresh: 'Refresh Status'
                    },
                    buttons: {
                        load: 'Load',
                        park: 'Park',
                        assistOn: 'Assist ON',
                        assistOff: 'Assist',
                        feed: 'Feed',
                        retract: 'Retract'
                    },
                    dialogs: {
                        feedTitle: 'Feed Filament - Slot {slot}',
                        retractTitle: 'Retract Filament - Slot {slot}',
                        length: 'Length (mm):',
                        speed: 'Speed (mm/s):',
                        execute: 'Execute',
                        cancel: 'Cancel'
                    },
                    notifications: {
                        websocketConnected: 'WebSocket connected',
                        websocketDisconnected: 'WebSocket disconnected',
                        apiError: 'API error: {error}',
                        loadError: 'Status load error: {error}',
                        commandSuccess: 'Command {command} executed successfully',
                        commandSent: 'Command {command} sent',
                        commandError: 'Error: {error}',
                        commandErrorGeneric: 'Command execution error',
                        executeError: 'Command execution error: {error}',
                        feedAssistOn: 'Feed assist enabled for slot {index}',
                        feedAssistOff: 'Feed assist disabled for slot {index}',
                        feedAssistAllOff: 'Feed assist disabled for all slots',
                        feedAssistAllOffError: 'Failed to disable feed assist',
                        refreshStatus: 'Status refreshed',
                        validation: {
                            tempRange: 'Temperature must be between 20 and 60°C',
                            durationMin: 'Duration must be at least 1 minute',
                            feedLength: 'Length must be at least 1 mm',
                            retractLength: 'Length must be at least 1 mm'
                        }
                    },
                    statusMap: {
                        ready: 'Ready',
                        busy: 'Busy',
                        unknown: 'Unknown',
                        disconnected: 'Disconnected'
                    },
                    dryerStatusMap: {
                        drying: 'Drying',
                        stop: 'Stopped'
                    },
                    slotStatusMap: {
                        ready: 'Ready',
                        empty: 'Empty',
                        busy: 'Busy',
                        unknown: 'Unknown'
                    },
                    rfidStatusMap: {
                        0: 'Not found',
                        1: 'Error',
                        2: 'Identified',
                        3: 'Identifying...'
                    },
                    common: {
                        unknown: 'Unknown'
                    },
                    time: {
                        hours: 'h',
                        minutes: 'min',
                        minutesShort: 'm',
                        secondsShort: 's'
                    }
                }
            },
            // Connection
            wsConnected: false,
            ws: null,
            apiBase: ACE_DASHBOARD_CONFIG?.apiBase || window.location.origin,
            
            // Device Status
            deviceStatus: {
                status: 'unknown',
                model: '',
                firmware: '',
                boot_firmware: '',
                filament_pos: 'unknown',
                current_index: -1,
                temp: 0,
                fan_speed: 0,
                enable_rfid: 0
            },
            
            // Dryer
            dryerStatus: {
                status: 'stop',
                target_temp: 0,
                duration: 0,
                remain_time: 0
            },
            dryingTemp: ACE_DASHBOARD_CONFIG?.defaults?.dryingTemp || 55,
            dryingDuration: ACE_DASHBOARD_CONFIG?.defaults?.dryingDuration || 240,
            
            // Slots
            slots: [],
            model: "",
            firmware: "",
            boot_firmware: "",
            filament_pos: "",
            currentTool: -1,
            current_index: -1,
            tempTimeouts: {}, 
            feedAssistSlot: -1,
            
            // Modals
            showFeedModal: false,
            showRetractModal: false,
            feedSlot: 0,
            feedLength: ACE_DASHBOARD_CONFIG?.defaults?.feedLength || 50,
            feedSpeed: ACE_DASHBOARD_CONFIG?.defaults?.feedSpeed || 25,
            retractSlot: 0,
            retractLength: ACE_DASHBOARD_CONFIG?.defaults?.retractLength || 50,
            retractSpeed: ACE_DASHBOARD_CONFIG?.defaults?.retractSpeed || 25,
            
            // Notifications
            notification: {
                show: false,
                message: '',
                type: 'info'
            }
        };
    },
    
    mounted() {
        this.connectWebSocket();
        this.loadStatus();
        this.updateDocumentTitle();
        
    },
    
    methods: {
        t(path, params = {}) {
            const keys = path.split('.');
            let value = this.translations[this.currentLanguage];
            for (const key of keys) {
                if (value && Object.prototype.hasOwnProperty.call(value, key)) {
                    value = value[key];
                } else {
                    return undefined;
                }
            }
            if (typeof value === 'string') {
                return value.replace(/\{(\w+)\}/g, (match, token) => {
                    return Object.prototype.hasOwnProperty.call(params, token) ? params[token] : match;
                });
            }
            return undefined;
        },

        toggleLanguage() {
            this.currentLanguage = this.currentLanguage === 'ru' ? 'en' : 'ru';
            this.updateDocumentTitle();
        },

        updateDocumentTitle() {
            document.title = this.t('header.title');
        },

        // WebSocket Connection
        connectWebSocket() {
            const wsUrl = getWebSocketUrl();
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                this.wsConnected = true;
                this.showNotification(this.t('notifications.websocketConnected'), 'success');
                this.subscribeToStatus();
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.wsConnected = false;
            };
            
            this.ws.onclose = () => {
                this.wsConnected = false;
                this.showNotification(this.t('notifications.websocketDisconnected'), 'error');
                // Reconnect after configured timeout
                const reconnectTimeout = ACE_DASHBOARD_CONFIG?.wsReconnectTimeout || 3000;
                setTimeout(() => this.connectWebSocket(), reconnectTimeout);
            };
        },
        
        subscribeToStatus() {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
            
            this.ws.send(JSON.stringify({
                jsonrpc: "2.0",
                method: "printer.objects.subscribe",
                params: {
                    objects: {
                        "ace": null
                    }
                },
                id: 5434
            }));
        },
        
        handleWebSocketMessage(data) {
            if (data.method === "notify_status_update") {
                const aceData = data.params[0]?.ace;
                if (aceData) {
                    this.updateStatus(aceData);
                }
            }

            if (data.method === "notify_gcode_response") {
                const text = data.params[0];

                if (!text) return;

                // Look for your ACE_SET_SLOT response
                if (text.includes("Slot") && text.includes("set:")) {
                    console.log("ACE slot update detected:", text);

                    // Just reload status once
                    this.loadStatus();
                }

                // Filament position update
                if (text.includes("ace_filament_pos set to")) {
                    const match = text.match(/ace_filament_pos set to (\w+)/);

                    if (match && match[1]) {
                        const newPos = match[1];
                        console.log("Filament position updated:", newPos);

                        this.deviceStatus.filament_pos = newPos;
                    }
                }

                // Detect tool load
                if (text.includes("Tool ") && text.includes(" load")) {
                    const match = text.match(/Tool (-?\d+) load/);

                    if (match && match[1] !== undefined) {
                        const slot = parseInt(match[1]);
                        console.log("Current slot updated:", slot);

                        this.deviceStatus.current_index = slot;
                    }
                }
            }
        },
        
        updateTemp(index, value) {
            clearTimeout(this.tempTimeouts[index]);

            this.tempTimeouts[index] = setTimeout(() => {
                this.updateSlot(index, { temp: parseInt(value) });
            }, 1000); // 500ms delay
        },

        getColorHex(rgb) {
 	    if (!Array.isArray(rgb) || rgb.length !== 3) return "#000000";

    	    return "#" + rgb.map(c =>
                c.toString(16).padStart(2, '0')
    	    ).join('');
	},

        hexToRgb(hex) {
            hex = hex.replace('#', '');
            return [
                parseInt(hex.substring(0, 2), 16),
                parseInt(hex.substring(2, 4), 16),
                parseInt(hex.substring(4, 6), 16)
            ];
        },

        async updateSlotColor(index, hexColor) {
            const hex = hexColor.replace('#', '');
            const rgb = [
                parseInt(hex.substring(0, 2), 16),
                parseInt(hex.substring(2, 4), 16),
                parseInt(hex.substring(4, 6), 16)
            ];
            this.loadStatus();
            this.updateSlot(index, { color: rgb });

        },

        async updateSlot(index, updates) {
            try {
                const url = `${window.location.protocol}//${window.location.hostname}:7125/server/ace/update_slot`;

                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        index: index,
                        ...updates
                    })
                });

                const result = await response.json();

                if (!response.ok || result.error) {
                    alert("Update failed:\n" + JSON.stringify(result));
                    return;
                }

                this.loadStatus();
                console.log("Slot updated:", updates);

            } catch (e) {
                alert("Network error:\n" + e);
            }
        },

        // API Calls
        async loadStatus() {
            try {
                const response = await fetch(`${this.apiBase}/server/ace/status`);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                
                if (ACE_DASHBOARD_CONFIG?.debug) {
                    console.log('Status response:', result);
                }
                
                if (result.error) {
                    console.error('API error:', result.error);
                    this.showNotification(this.t('notifications.apiError', { error: result.error }), 'error');
                    return;
                }
                
                const statusData = result.result || result;
                
                if (statusData && typeof statusData === 'object' && 
                    (statusData.status !== undefined || statusData.slots !== undefined || statusData.dryer !== undefined)) {
                    this.updateStatus(statusData);
                } else {
                    console.warn('Invalid status data in response:', result);
                }
            } catch (error) {
                console.error('Error loading status:', error);
                this.showNotification(this.t('notifications.loadError', { error: error.message }), 'error');
            }
        },

        updateStatus(data) {
            if (!data || typeof data !== 'object') {
                console.warn('Invalid status data:', data);
                return;
            }
            if (ACE_DASHBOARD_CONFIG?.debug) {
                console.log('Updating status with data:', data);
            }            
            if (data.status !== undefined) {
                this.deviceStatus.status = data.status;
            }
            if (data.model !== undefined) {
                this.deviceStatus.model = data.model;
            }
            if (data.firmware !== undefined) {
                this.deviceStatus.firmware = data.firmware;
            }
            if (data.boot_firmware !== undefined) {
                this.deviceStatus.boot_firmware = data.boot_firmware;
            }
            if (data.filament_pos !== undefined) {
                this.deviceStatus.filament_pos = data.filament_pos;
            }
            if (data.current_index !== undefined) {
                this.deviceStatus.current_index = data.current_index;
            }
            if (data.temp !== undefined) {
                this.deviceStatus.temp = data.temp;
            }
            if (data.fan_speed !== undefined) {
                this.deviceStatus.fan_speed = data.fan_speed;
            }
            if (data.enable_rfid !== undefined) {
                this.deviceStatus.enable_rfid = data.enable_rfid;
            }
            if (data.device_info) {
                this.model = data.device_info.model || "";
                this.firmware = data.device_info.firmware || "";
                this.boot_firmware = data.device_info.boot_firmware || "";
            }
            const dryer = data.dryer || data.dryer_status;
            
            if (dryer && typeof dryer === 'object') {
                if (dryer.duration !== undefined) {
                    this.dryerStatus.duration = Math.floor(dryer.duration);
                }
                
                if (dryer.remain_time !== undefined) {
                    let remain_time = dryer.remain_time;
                    
                    if (remain_time > 1440) {
                        remain_time = remain_time / 60;
                    }
                    else if (this.dryerStatus.duration > 0 && remain_time > this.dryerStatus.duration * 1.5 && remain_time > 60) {
                        remain_time = remain_time / 60;
                    }
                    
                    this.dryerStatus.remain_time = remain_time;
                }
                if (dryer.status !== undefined) {
                    this.dryerStatus.status = dryer.status;
                }
                if (dryer.target_temp !== undefined) {
                    this.dryerStatus.target_temp = dryer.target_temp;
                }
            }
            
            if (data.slots !== undefined) {
                if (Array.isArray(data.slots)) {
                    this.slots = data.slots.map(slot => ({
                        index: slot.index !== undefined ? slot.index : -1,
                        status: slot.status || 'unknown',
                        type: slot.type || '',
                        color: Array.isArray(slot.color) ? slot.color : [0, 0, 0],
                        temp: slot.temp !== undefined ? slot.temp : 0,
                        sku: slot.sku || '',
                        rfid: slot.rfid !== undefined ? slot.rfid : 0
                    }));
                } else {
                    console.warn('Slots data is not an array:', data.slots);
                }
            }
            
            if (data.feed_assist_slot !== undefined) {
                this.feedAssistSlot = data.feed_assist_slot;
            } else if (data.feed_assist_count !== undefined && data.feed_assist_count > 0) {
                if (this.feedAssistSlot === -1) {
                    if (this.currentTool !== -1 && this.currentTool < 4) {
                        this.feedAssistSlot = this.currentTool;
                    }
                }
            } else {
                this.feedAssistSlot = -1;
            }
            
            if (ACE_DASHBOARD_CONFIG?.debug) {
                console.log('Status updated:', {
                    deviceStatus: this.deviceStatus,
                    dryerStatus: this.dryerStatus,
                    slotsCount: this.slots.length,
                    feedAssistSlot: this.feedAssistSlot
                });
            }
        },
        
        async executeCommand(command, params = {}) {
            try {
                const response = await fetch(`${this.apiBase}/server/ace/command`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        command: command,
                        params: params
                    })
                });
                
                const result = await response.json();
                
                if (ACE_DASHBOARD_CONFIG?.debug) {
                    console.log('Command response:', result);
                }
                
                if (result.error) {
                    this.showNotification(this.t('notifications.apiError', { error: result.error }), 'error');
                    return false;
                }
                
                if (result.result) {
                    if (result.result.success !== false && !result.result.error) {
                        this.showNotification(this.t('notifications.commandSuccess', { command }), 'success');
                        // Reload status after command
                        setTimeout(() => this.loadStatus(), 1000);
                        return true;
                    } else {
                        const errorMsg = result.result.error || result.result.message || this.t('notifications.commandErrorGeneric');
                        this.showNotification(this.t('notifications.commandError', { error: errorMsg }), 'error');
                        return false;
                    }
                }
                
                // Если нет result, но и нет ошибки - считаем успехом
                this.showNotification(this.t('notifications.commandSent', { command }), 'success');
                setTimeout(() => this.loadStatus(), 1000);
                return true;
            } catch (error) {
                console.error('Error executing command:', error);
                this.showNotification(this.t('notifications.executeError', { error: error.message }), 'error');
                return false;
            }
        },
        
        // Device Actions
        async changeTool(tool) {
            const success = await this.executeCommand('ACE_CHANGE_TOOL', { TOOL: tool });
            if (success) {
                this.currentTool = tool;
            }
        },
        
        async unloadFilament() {
            await this.changeTool(-1);
        },

        async stopAssist() {
            let anySuccess = false;
            for (let index = 0; index < 4; index++) {
                const success = await this.executeCommand('ACE_DISABLE_FEED_ASSIST', { INDEX: index });
                if (success) {
                    anySuccess = true;
                }
            }
            if (anySuccess) {
                this.feedAssistSlot = -1;
                this.showNotification(this.t('notifications.feedAssistAllOff'), 'success');
            } else {
                this.showNotification(this.t('notifications.feedAssistAllOffError'), 'error');
            }
        },
        
        async parkToToolhead(index) {
            await this.executeCommand('ACE_PARK_TO_TOOLHEAD', { INDEX: index });
        },
        
        // Feed Assist Actions
        async toggleFeedAssist(index) {
            if (this.feedAssistSlot === index) {
                await this.disableFeedAssist(index);
            } else {
                if (this.feedAssistSlot !== -1) {
                    await this.disableFeedAssist(this.feedAssistSlot);
                }
                await this.enableFeedAssist(index);
            }
        },
        
        async enableFeedAssist(index) {
            const success = await this.executeCommand('ACE_ENABLE_FEED_ASSIST', { INDEX: index });
            if (success) {
                this.feedAssistSlot = index;
                this.showNotification(this.t('notifications.feedAssistOn', { index }), 'success');
            }
        },
        
        async disableFeedAssist(index) {
            const success = await this.executeCommand('ACE_DISABLE_FEED_ASSIST', { INDEX: index });
            if (success) {
                this.feedAssistSlot = -1;
                this.showNotification(this.t('notifications.feedAssistOff', { index }), 'success');
            }
        },
        
        // Dryer Actions
        async startDrying() {
            if (this.dryingTemp < 20 || this.dryingTemp > 60) {
                this.showNotification(this.t('notifications.validation.tempRange'), 'error');
                return;
            }
            
            if (this.dryingDuration < 1) {
                this.showNotification(this.t('notifications.validation.durationMin'), 'error');
                return;
            }
            
            await this.executeCommand('ACE_START_DRYING', {
                TEMP: this.dryingTemp,
                DURATION: this.dryingDuration
            });
        },
        
        async stopDrying() {
            await this.executeCommand('ACE_STOP_DRYING');
        },
        
        // Feed/Retract Actions
        showFeedDialog(slot) {
            this.feedSlot = slot;
            this.feedLength = ACE_DASHBOARD_CONFIG?.defaults?.feedLength || 50;
            this.feedSpeed = ACE_DASHBOARD_CONFIG?.defaults?.feedSpeed || 25;
            this.showFeedModal = true;
        },
        
        closeFeedDialog() {
            this.showFeedModal = false;
        },
        
        async executeFeed() {
            if (this.feedLength < 1) {
                this.showNotification(this.t('notifications.validation.feedLength'), 'error');
                return;
            }
            
            const success = await this.executeCommand('ACE_FEED', {
                INDEX: this.feedSlot,
                LENGTH: this.feedLength,
                SPEED: this.feedSpeed
            });
            
            if (success) {
                this.closeFeedDialog();
            }
        },
        
        showRetractDialog(slot) {
            this.retractSlot = slot;
            this.retractLength = ACE_DASHBOARD_CONFIG?.defaults?.retractLength || 50;
            this.retractSpeed = ACE_DASHBOARD_CONFIG?.defaults?.retractSpeed || 25;
            this.showRetractModal = true;
        },
        
        closeRetractDialog() {
            this.showRetractModal = false;
        },
        
        async executeRetract() {
            if (this.retractLength < 1) {
                this.showNotification(this.t('notifications.validation.retractLength'), 'error');
                return;
            }
            
            const success = await this.executeCommand('ACE_RETRACT', {
                INDEX: this.retractSlot,
                LENGTH: this.retractLength,
                SPEED: this.retractSpeed
            });
            
            if (success) {
                this.closeRetractDialog();
            }
        },
        
        async refreshStatus() {
            await this.loadStatus();
            this.showNotification(this.t('notifications.refreshStatus'), 'success');
        },
        
        // Utility Functions
        getStatusText(status) {
            return this.t(`statusMap.${status}`) || status;
        },
        
        getDryerStatusText(status) {
            return this.t(`dryerStatusMap.${status}`) || status;
        },
        
        getSlotStatusText(status) {
            return this.t(`slotStatusMap.${status}`) || status;
        },
        
        getRfidStatusText(rfid) {
            const value = this.t(`rfidStatusMap.${rfid}`);
            return value === `rfidStatusMap.${rfid}` ? this.t('common.unknown') : value;
        },
        
        getColorHex(color) {
            if (!color || !Array.isArray(color) || color.length < 3) {
                return '#000000';
            }
            const r = Math.max(0, Math.min(255, color[0])).toString(16).padStart(2, '0');
            const g = Math.max(0, Math.min(255, color[1])).toString(16).padStart(2, '0');
            const b = Math.max(0, Math.min(255, color[2])).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`;
        },
        
        formatTime(minutes) {
            if (!minutes || minutes <= 0) return `0 ${this.t('time.minutes')}`;
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            if (hours > 0) {
                return `${hours}${this.t('time.hours')} ${mins}${this.t('time.minutesShort')}`;
            }
            return `${mins} ${this.t('time.minutes')}`;
        },
        
        formatRemainingTime(minutes) {
            if (!minutes || minutes <= 0) return `0${this.t('time.minutesShort')} 0${this.t('time.secondsShort')}`;
            
            const totalMinutes = Math.floor(minutes);
            const fractionalPart = minutes - totalMinutes;
            const seconds = Math.round(fractionalPart * 60);
            
            if (totalMinutes > 0) {
                if (seconds > 0) {
                    return `${totalMinutes}${this.t('time.minutesShort')} ${seconds}${this.t('time.secondsShort')}`;
                }
                return `${totalMinutes}${this.t('time.minutesShort')}`;
            }
            return `${seconds}${this.t('time.secondsShort')}`;
        },
        
        showNotification(message, type = 'info') {
            this.notification = {
                show: true,
                message: message,
                type: type
            };
            
            setTimeout(() => {
                this.notification.show = false;
            }, 3000);
        }
    }
}).mount('#app');
