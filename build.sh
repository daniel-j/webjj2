#!/bin/sh
# Created by djazz

version=$1
name="webjj2"

echo "Building $name v$version"

prefix="$name-v$version"
dir=`pwd`

echo "Building Chrome application"
# Chrome application
google-chrome --pack-extension="$dir/project/" --pack-extension-key="$dir/webjj2.pem"
mv project.crx build/chrome/$prefix.crx


echo "Building nw package"
# Create the package
rm -f build/any/$prefix.nw
cd project
zip -r ../build/any/$prefix.nw .
cd ..

# Entering build directory
cd build/

echo "Building for Linux x64"
# Linux x64
cd linux64/
rm -f $prefix-linux.x64
cat ../../nw/linux64/nw ../any/$prefix.nw > $prefix-linux.x64
chmod +x $prefix-linux.x64
rm -f $prefix-linux64.zip
zip -j $prefix-linux64.zip $prefix-linux.x64 ../../nw/linux64/nw.pak ../../nw/linux64/libffmpegsumo.so
rm $prefix-linux.x64
cd ..

echo "Building for Linux ia32"
# Linux ia32
cd linux32/
rm -f $prefix-linux.ia32
cat ../../nw/linux32/nw ../any/$prefix.nw > $prefix-linux.ia32
chmod +x $prefix-linux.ia32
rm -f $prefix-linux32.zip
zip -j $prefix-linux32.zip $prefix-linux.ia32 ../../nw/linux32/nw.pak ../../nw/linux32/libffmpegsumo.so
rm $prefix-linux.ia32
cd ..

echo "Building for Windows (win32)"
# Windows (win32)
cd win32/
rm -f $prefix-win32.exe
cat ../../nw/win32/nw.exe ../any/$prefix.nw > $prefix-win32.exe
chmod +x $prefix-win32.exe
rm -f $prefix-win32.zip
zip -j $prefix-win32.zip $prefix-win32.exe ../../nw/win32/nw.pak ../../nw/win32/ffmpegsumo.dll ../../nw/win32/icudt.dll ../../nw/win32/libEGL.dll ../../nw/win32/libGLESv2.dll
rm $prefix-win32.exe
cd ..

echo "Done"
