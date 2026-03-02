Make a bckaup of your current mainsail directory.
```bash
cp -R /usr/data/mainsail /usr/data/mainsail_old
```

Unzip the mainsail_2-17-0.zip file to the mainsail directory.
```bash
unzip mainsail_2-17-0.zip /usr/data/mainsail
```

now run the following 2 commands as well.
```bash
chown -R root:root /usr/data/mainsail
chown -R 755 /usr/data/mainsail
```

Reload the mainsail page.  If the panel is not showing up force refresh the page with CTRL + F5.
Check the settings/dashboard page to make sure the panel is checked and you can move it wherever you want.

This will update your mainsail to 2.17.0

If you encounter any bugs please let us know.
