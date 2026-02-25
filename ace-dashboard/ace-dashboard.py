import subprocess
import os

def run_http_server_in_background(port=4410, directory="/usr/data/ace-dashboard"):
    """
    Runs a simple Python http.server in the background.

    Args:
        port (int): The port number for the server.
        directory (str): The directory to serve files from.
    """
    # Change to the specified directory
    os.chdir(directory)

    # Command to run the http.server
    # -m http.server starts the module
    # port specifies the port
    # --bind 0.0.0.0 makes it accessible from other devices on the network
    command = ["python3", "-m", "http.server", str(port), "--bind", "0.0.0.0"]

    # Use subprocess.Popen to run the command
    # creationflags for Windows to detach the process (DETACHED_PROCESS)
    # close_fds=True to close file descriptors in the child process
    # stdout and stderr are redirected to DEVNULL to suppress output
    if os.name == 'nt':  # For Windows
        creationflags = subprocess.DETACHED_PROCESS
        subprocess.Popen(command, creationflags=creationflags, close_fds=True,
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    else:  # For Unix-like systems (Linux, macOS)
        # Use preexec_fn to set the process group ID, effectively detaching
        # This is a common pattern for background processes on Unix-like systems
        subprocess.Popen(command, preexec_fn=os.setsid, close_fds=True,
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    print(f"HTTP server started in the background on port {port}, serving from '{directory}'")

if __name__ == "__main__":
    # Example usage: run server on port 8000 serving current directory
    run_http_server_in_background(port=4410, directory="/usr/data/ace-dashboard")

    # You can then continue with other operations in your script or close the terminal.
    # The server will continue running.
    # To stop it, you would need to find its process ID and terminate it manually.
