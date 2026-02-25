"""
Moonraker API Extension ValgACE

1. /usr/data/moonraker/moonraker/moonraker/components/ace_status.py
2. moonraker.conf:
   [ace_status]
"""

from __future__ import annotations
import logging
from typing import TYPE_CHECKING, Optional, Dict, Any
if TYPE_CHECKING:
    from confighelper import ConfigHelper
    from websockets import WebRequest
    from . import klippy_apis
    APIComp = klippy_apis.KlippyAPI


class AceStatus:
    '''Beginning'''
    def __init__(self, config: ConfigHelper):
        self.confighelper = config
        self.server = config.get_server()
        self.logger = logging.getLogger(__name__)
        self.cached_model = "unknown"
        self.cached_firmware = "unknown"
        self.last_info_update = 0
#        self.variables = self.printer.lookup_object('save_variables').allVariables

        # klippy_apis
        self.klippy_apis: APIComp = self.server.lookup_component('klippy_apis')

        self.server.register_endpoint(
            "/server/ace/status",
            ['GET'],
            self.handle_status_request
        )
        self.server.register_endpoint(
            "/server/ace/slots",
            ['GET'],
            self.handle_slots_request
        )
        self.server.register_endpoint(
            "/server/ace/command",
            ['POST'],
            self.handle_command_request
        )
        self.server.register_endpoint(
            "/server/ace/set_slot_color",
            ['POST'],
            self.handle_set_slot_color
        )
        self.server.register_endpoint(
            "/server/ace/set_slot_type",
            ['POST'],
            self.handle_set_slot_type
        )
        self.server.register_endpoint(
            "/server/ace/update_slot",
            ['POST'],
            self.handle_update_slot
        )
        self.server.register_event_handler(
            "server:status_update",
            self._handle_status_update
        )

        self._last_status: Optional[Dict[str, Any]] = None

        self.logger.info("ACE Status API extension loaded")

    async def handle_status_request(self, webrequest: WebRequest) -> Dict[str, Any]:
        '''Handles status request'''
        try:
            try:
                result = await self.klippy_apis.query_objects({'ace': None})
                ace_data = result.get('ace')

                if ace_data and isinstance(ace_data, dict):
                    # Merge ace_inventory from save_variables
                    try:
                        save_vars = await self.klippy_apis.query_objects(
                            {"save_variables": None}
                        )
                        variables = save_vars.get("save_variables", {}).get("variables", {})
                        inventory = variables.get("ace_inventory")
                        filament_pos = variables.get("ace_filament_pos")
                        current_index = variables.get("ace_current_index")

                        if isinstance(filament_pos, str):
                            ace_data["filament_pos"] = filament_pos
                        else:
                            ace_data["filament_pos"] = "unknown"

                        if isinstance(current_index, str):
                            ace_data["current_index"] = current_index
                        else:
                            ace_data["current_index"] = "None"

                        if isinstance(inventory, str):
                            try:
                                inventory = json.loads(inventory)
                            except Exception:
                                inventory = None

                        if isinstance(inventory, list):
                            ace_data["slots"] = inventory
                    except Exception:
                        pass
                    self._last_status = ace_data

#                    import time

#                    if time.time() - self.last_info_update > 60:
#                        response = await self.klippy_apis.run_gcode(
#                            "ACE_DEBUG METHOD=get_info"
#                        )
#                        result = response.get("result", {})
#                        self.cached_model = result.get("model", "unknown")
#                        self.cached_firmware = result.get("firmware", "unknown")
#                        self.last_info_update = time.time()

                    ace_data["model"] = self.cached_model
                    ace_data["firmware"] = self.cached_firmware

                    return ace_data
                else:
                    self.logger.debug("ACE data not found in query_objects response")

            except Exception as e:
                self.logger.debug(f"Could not get ACE data from query_objects: {e}")

            # Fallback:
            if self._last_status:
                self.logger.debug("Using cached ACE status")
                return self._last_status

            self.logger.warning("No ACE data available, returning default structure")
            return {
                "status": "unknown",
                "model": "unknown",
                "firmware": "unknown",
                "dryer": {
                    "status": "stop",
                    "target_temp": 0,
                    "duration": 0,
                    "remain_time": 0
                },
                "temp": 0,
                "fan_speed": 0,
                "enable_rfid": 0,
                "slots": [
                    {
                        "index": i,
                        "status": "unknown",
                        "type": "",
                        "color": [0, 0, 0],
                        "sku": "",
                        "rfid": 0
                    } for i in range(4)]
            }

        except Exception as e:
            import traceback
            self.logger.error(f"Error getting ACE status: {e}")
            self.logger.error(f"Traceback: {traceback.format_exc()}")
            return {"error": str(e)}

    async def handle_slots_request(self, webrequest: WebRequest) -> Dict[str, Any]:
        '''Handles the slot request'''
        try:
            status = await self.handle_status_request(webrequest)

            if "error" in status:
                return status

            slots = status.get("slots", [])
            return {
                "slots": slots
            }

        except Exception as e:
            self.logger.error(f"Error getting slots: {e}")
            return {"error": str(e)}

    async def handle_command_request(self, webrequest: WebRequest) -> Dict[str, Any]:
        '''Handles the Command Request'''
        try:
            command = webrequest.get_str("command", None)

            if not command:
                try:
                    json_body = await webrequest.get_json()
                    if isinstance(json_body, dict):
                        command = json_body.get("command")
                except Exception:
                    pass

            if not command:
                return {"error": "Command parameter is required"}

            params: Dict[str, Any] = {}

            try:
                json_body = await webrequest.get_json()
                if isinstance(json_body, dict) and "params" in json_body:
                    jb_params = json_body["params"]
                    if isinstance(jb_params, dict):
                        params.update(jb_params)
            except Exception:
                pass

            try:
                args = webrequest.get_args()
            except Exception:
                args = None

            if args:
                qp_params = args.get('params')
                if qp_params:
                    parsed = None
                    if isinstance(qp_params, str):
                        try:
                            import json as _json
                            parsed = _json.loads(qp_params)
                        except Exception:
                            try:
                                parsed = eval(qp_params, {"__builtins__": {}})
                            except Exception:
                                parsed = None
                    elif isinstance(qp_params, dict):
                        parsed = qp_params
                    if isinstance(parsed, dict):
                        params.update(parsed)

                for k, v in args.items():
                    if k in ("command", "params"):
                        continue
                    params[str(k)] = v

            gcode_cmd = command
            if params:
                def _fmt_val(val):
                    if isinstance(val, bool):
                        return '1' if val else '0'
                    return str(val)
                param_str = " ".join([f"{k}={_fmt_val(v)}" for k, v in params.items()])
                gcode_cmd = f"{command} {param_str}"

            try:
                await self.klippy_apis.run_gcode(gcode_cmd)

                return {
                    "success": True,
                    "message": f"Command {command} executed successfully",
                    "command": gcode_cmd
                }
            except Exception as e:
                self.logger.error(f"Error executing ACE command {gcode_cmd}: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "command": gcode_cmd
                }

        except Exception as e:
            self.logger.error(f"Error handling ACE command request: {e}")
            return {"error": str(e)}

    async def _handle_status_update(self, status: Dict[str, Any]) -> None:
        try:
            ace_data = status.get('ace')

            if ace_data:
                self._last_status = ace_data
                self.server.send_event("ace:status_update", ace_data)
        except Exception as e:
            self.logger.debug(f"Error handling status update: {e}")

    async def handle_set_slot_color(self, webrequest):
        '''Handles updating slot colors'''
        try:
            # Creality Moonraker uses get_args()
            data = webrequest.get_args()

            index = int(data.get("index"))
            color = data.get("color")

            # If color arrives as string, parse it
            if isinstance(color, str):
                import json
                color = json.loads(color)

            color = [int(c) for c in color]

            # Get current saved variables
            result = await self.klippy_apis.query_objects({"save_variables": None})
            variables = result.get("save_variables", {}).get("variables", {})

            inventory = variables.get("ace_inventory")

            if not isinstance(inventory, list):
                return {"error": "ace_inventory not found or invalid"}

            # Update correct slot
            for slot in inventory:
                if slot.get("index") == index:
                    slot["color"] = color
                    break

            # IMPORTANT: Your firmware expects Python literal, not JSON
            value_str = repr(inventory)
            escaped = value_str.replace('"', '\\"')

            gcode_cmd = f'SAVE_VARIABLE VARIABLE=ace_inventory VALUE="{escaped}"'

            self.logger.info(f"Running: {gcode_cmd}")

            await self.klippy_apis.run_gcode(gcode_cmd)

            self.server.send_event(
                "ace_status_update",
                {
                    "ace_inventory": self.ace_inventory,
                    "filament_pos": self.filament_pos,
                    "current_index": self.current_index
                }
            )

            return {"success": True}

        except Exception as e:
            self.logger.error(f"Color save error: {e}")
            return {"error": str(e)}

    async def handle_set_slot_type(self, webrequest):
        '''Handles updating Slot type - PLA, PETG, etc'''
        try:
            data = webrequest.get_args()

            index = int(data.get("index"))
            new_type = str(data.get("type"))

            result = await self.klippy_apis.query_objects({"save_variables": None})
            variables = result.get("save_variables", {}).get("variables", {})

            inventory = variables.get("ace_inventory")

            if not isinstance(inventory, list):
                return {"error": "ace_inventory not found or invalid"}

            # Update slot
            for slot in inventory:
                if slot.get("index") == index:
                    slot["type"] = new_type
                    break

            # Save using Python literal
            value_str = repr(inventory)
            escaped = value_str.replace('"', '\\"')

            gcode_cmd = f'SAVE_VARIABLE VARIABLE=ace_inventory VALUE="{escaped}"'

            await self.klippy_apis.run_gcode(gcode_cmd)

            self.server.send_event(
                "ace_status_update",
                {
                    "ace_inventory": self.ace_inventory,
                    "filament_pos": self.filament_pos,
                    "current_index": self.current_index
                }
            )

            return {"success": True}

        except Exception as e:
            self.logger.error(f"Type save error: {e}")
            return {"error": str(e)}

    async def handle_update_slot(self, webrequest):
        '''Handles updating the slot information'''
        try:
            data = webrequest.get_args()

            index = int(data.get("index"))

            new_color = data.get("color")
            new_type = data.get("type")
            new_temp = data.get("temp")

            # Parse color if string
            if isinstance(new_color, str):
                import json
                new_color = json.loads(new_color)

            if new_color is not None:
                # If color comes as JSON string
                if isinstance(new_color, str):
                    try:
                        import json
                        new_color = json.loads(new_color)
                    except:
                        # If it comes as "255,0,0"
                        new_color = [int(x) for x in new_color.split(",")]

                new_color = [int(c) for c in new_color]

            if new_temp is not None:
                new_temp = int(new_temp)

            # Load inventory
            result = await self.klippy_apis.query_objects({"save_variables": None})
            variables = result.get("save_variables", {}).get("variables", {})
            inventory = variables.get("ace_inventory")
            current_index = variables.get("ace_current_index")

            if not isinstance(inventory, list):
                return {"error": "ace_inventory not found or invalid"}

            # Default material temp map
            material_temps = {
                "PLA": 220,
                "PETG": 250,
                "ABS": 250,
                "ASA": 255,
                "OTHER": 0
            }

            # Update slot
            for slot in inventory:
                if slot.get("index") == index:

                    if new_color is not None:
                        slot["color"] = new_color

                    if new_type is not None:
                        slot["type"] = new_type

                        # Auto update temp when type changes
                        if new_type in material_temps:
                            slot["temp"] = material_temps[new_type]

                    if new_temp is not None:
                        slot["temp"] = new_temp

                    break

            # Save using Python literal (required for your firmware)
            value_str = repr(inventory)
            escaped = value_str.replace('"', '\\"')

            gcode_cmd = f'SAVE_VARIABLE VARIABLE=ace_inventory VALUE="{escaped}"'

            await self.klippy_apis.run_gcode(gcode_cmd)

            self.server.send_event(
                "ace_status_update",
                {
                    "ace_inventory": self.ace_inventory,
                    "filament_pos": self.filament_pos,
                    "current_index": self.current_index
                }
            )

            return {"success": True}

        except Exception as e:
            self.logger.error(f"Update slot error: {e}")
            return {"error": str(e)}

def load_component(config: ConfigHelper) -> AceStatus:
    '''Closing'''
    return AceStatus(config)
