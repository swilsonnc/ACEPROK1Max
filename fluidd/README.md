<picture>
  <a href="https://github.com/swilsonnc/ACEPROK1Max/blob/master/img/fluidd.png" target=_new><img src="https://github.com/swilsonnc/ACEPROK1Max/blob/master/img/fluidd.png" alt="" style="width:480px;"></a>
  <a href="https://github.com/swilsonnc/ACEPROK1Max/blob/master/img/fluidd_printing.png" target=_new><img src="https://github.com/swilsonnc/ACEPROK1Max/blob/master/img/fluidd_printing.png" alt="" style="width:520px;"></a>
</picture>

Make a backup of your current fluidd directory.
```bash
cp -R /usr/data/fluidd /usr/data/fluidd_old
```

Unzip the fluidd_1-36-2.zip file to the fluidd directory.
```bash
unzip fluidd_1-36-2.zip /usr/data/fluidd
```

now run the following 2 commands as well.
```bash
chown -R root:root /usr/data/fluidd
chown -R 755 /usr/data/fluidd
```

Reload the fluidd page.  If the panel is not showing up force refresh the page with CTRL + F5.
Check the settings/dashboard page to make sure the panel is checked and you can move it wherever you want.

This will update your fluidd to 1.36.2 and will break if it updates to a newer version.

If you encounter any bugs please let us know.
