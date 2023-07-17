@ECHO OFF
ECHO Installing repository and submodules...
git clone --recurse-submodules -j8 https://github.com/LimitlessSocks/TDOANE-CardMaker.git
cd TDOANE-CardMaker
REM branch specific: ygoprodeck variant
git checkout ygoprodeck
ECHO Instaling dependencies...
npm install connect
npm install serve-static
npm install almond