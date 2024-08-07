# Abyssal Fear

New features and entities
* Alt-Fire, holster, and reload functions
* Improvements and changes to enemy AI
* New editor entities (TextureSwitcher, SwitchChecker, DateChecker, Player Parenter, etc.)
* Additions to existing entities (SoundHolder pitch and 3D properties, trigger types and console messages, etc.)
* Player movement tweaks
* Hitboxes (for different wound and death animations, along with damage multipliers)

Upcoming features
* Ladders and ropes
* Physics (Ragdolls, ropes, brushes, models, joints, etc.)
* Inventory system (Puzzle items, notes, dropping and combining, etc.)

Resources: Currently unavailable, new version will be uploaded soon!
* Audio: https://www.dropbox.com/scl/fi/wdrum4qpkvha4ya32zl7e/AbyssalFearCUTestAudio.zip?rlkey=skyn8iawgt3lizs06qvrmb2p5&st=on81o9zv&dl=0
* Data: https://www.dropbox.com/scl/fi/2mo6ytdz9wdz9yht72kmj/AbyssalFearCUTestData.zip?rlkey=a2c8ylazcmnwbrmh6b31vdopm&st=i6wy9gn9&dl=0
* Models: https://www.dropbox.com/scl/fi/8n1mouhqu9nopeutiwlsc/AbyssalFearCUTestModels.zip?rlkey=ikw68c6q4i384jirdjrpi84i4&st=v2t2suic&dl=0
* Textures: https://www.dropbox.com/scl/fi/0106xtz22mp0jdo2e9w3i/AbyssalFearCUTestTextures.zip?rlkey=xlgc44w0o3y7imkcnpi2z3v5l&st=hp137wir&dl=0

# Serious Engine

[![Build status](https://ci.appveyor.com/api/projects/status/32r7s2skrgm9ubva?retina=true)](https://ci.appveyor.com/project/SeriousAlexej/Serious-Engine)

### Video Demonstration (YouTube, clickable)
[![Feature Showcase](https://img.youtube.com/vi/0rrdHwJSGF8/maxresdefault.jpg)](https://youtu.be/0rrdHwJSGF8)

Enhanced and somewhat fixed version of engine tools (Modeler, World Editor)
* Compatible with 1.07!
* Engine now supports **A LOT** more image formats for texture creation (such as PNG for example)
* Serious Modeler can now import skeletal animations! (baked into vertex frame animation during the import for compatibility)
* Added Property Tree for Serious Editor for more convenient workflow!
* Updated version of `assimp`, more import formats are available!
* Modeler upgrade to correctly read imported UV map without tears at seams (previously required creation of additional surfaces at seams to avoid that problem)
* Modeler has convenient UI for configuring model instead of manual script writing
* Replaced missing `exploration3D` library with `assimp` (for importing 3D models into Modeler / World Editor)
* Added ability to import UV maps (with up to 3 channels) when converting 3D model into brush (World Editor)
* World Editor bugfix to correctly display color selection window
* New advanced UV mapping tools for World Editor

<details>
  <summary>Skeletal animation demos</summary>
  
  <p align="center">
  Skeletal animation import support in Serious Modeler
  </p>
  <p align="center">
    <img src="https://raw.githubusercontent.com/SeriousAlexej/Serious-Engine/master/Help/run_flesh.gif">
  </p>
  <p align="center">
  Same model with automatically generated triangles per each bone
    <img src="https://raw.githubusercontent.com/SeriousAlexej/Serious-Engine/master/Help/run_bones.gif">
  </p>
</details>

<details>
  <summary>New Property Tree in Serious Editor</summary>

  <p align="center">
    <img src="https://raw.githubusercontent.com/SeriousAlexej/Serious-Engine/master/Help/editor_property_tree.gif">
  </p>
  <p align="center">
    <img src="https://raw.githubusercontent.com/SeriousAlexej/Serious-Engine/master/Help/editor_property_tree_2.gif">
  </p>
</details>

<details>
  <summary>New 3D formats importing demos</summary>
  
  <p align="center">
  Importing 3D meshes with multiple UV maps as brushes in World Editor
  </p>
  <p align="center">
    <img src="https://raw.githubusercontent.com/SeriousAlexej/Serious-Engine/master/Help/editor_model.gif">
  </p>
  
  <p align="center">
  List of new supported 3D file formats
  </p>
  <p align="center">
    <img src="https://raw.githubusercontent.com/SeriousAlexej/Serious-Engine/master/Help/modeler_formats.gif">
  </p>
  
  <p align="center">
  Modeler correctly imports UV map without distorsions by default
  </p>
  <p align="center">
    <img src="https://raw.githubusercontent.com/SeriousAlexej/Serious-Engine/master/Help/modeler.gif">
  </p>
</details>

<details>
  <summary>World Editor mapping demos</summary>
  
  <p align="center">
  3D Importing with UV maps - General demo:
  </p>
  <p align="center">
    <img src="https://raw.githubusercontent.com/SeriousAlexej/Serious-Engine/master/Help/Import3D_Demo.gif">
  </p>
  
  <p align="center">
  Advanced mapping - General demo:
  </p>
  <p align="center">
    <img src="https://raw.githubusercontent.com/SeriousAlexej/Serious-Engine/master/Help/AdvancedMapping_Demo.gif">
  </p>
  
  <p align="center">
  Advanced mapping - Rotation alignment:
  </p>
  <p align="center">
    <img src="https://raw.githubusercontent.com/SeriousAlexej/Serious-Engine/master/Help/AdvancedMapping_Rotate.gif">
  </p>
  
  <p align="center">
  Advanced mapping - Alignment by adjacent edge:
  </p>
  <p align="center">
    <img src="https://raw.githubusercontent.com/SeriousAlexej/Serious-Engine/master/Help/AdvancedMapping_Adjacent.gif">
  </p>
  
  <p align="center">
  Advanced mapping - Alignment by tangent edge:
  </p>
  <p align="center">
    <img src="https://raw.githubusercontent.com/SeriousAlexej/Serious-Engine/master/Help/AdvancedMapping_Tangent.gif">
  </p>
  
  <p align="center">
  Advanced mapping - Alignment by adjacent and tangent edges:
  </p>
  <p align="center">
    <img src="https://raw.githubusercontent.com/SeriousAlexej/Serious-Engine/master/Help/AdvancedMapping_Adjacent_Tangent.gif">
  </p>
</details>

Original ReadMe:
=======================

This is the source code for Serious Engine v.1.10, including the following projects:

* `DedicatedServer`
* `Ecc` The *Entity Class Compiler*, a custom build tool used to compile *.es files
* `Engine` Serious Engine 1.10
* `EngineGUI` Common GUI things for game tools
* `EntitiesMP` All the entity logic
* `GameGUIMP` Common GUI things for game tools
* `GameMP` All the game logic
* `Modeler` Serious Modeler
* `RCon` Used to connect to servers using an admin password
* `SeriousSam` The main game executable
* `SeriousSkaStudio` Serious Ska Studio
* `WorldEditor` Serious Editor
* `DecodeReport` Used to decode crash *.rpt files
* `Depend` Used to build a list of dependency files based on a list of root files
* `LWSkaExporter` Exporter for use in LightWave
* `MakeFONT` Used for generating *.fnt files
* `Shaders` Compiled shaders
* `GameAgent` The serverlist masterserver written in Python
* `libogg`, `libvorbis` Third party libraries used for playing OGG-encoded ingame music (see http://www.vorbis.com/ for more information)

These have been modified to run correctly under the recent version of Windows. (Tested: Win7 x64, Win8 x64, Win8.1 x64)

Building
--------

To build Serious Engine 1, you'll need Visual Studio 2013 or 2015, Professional or Community edition ( https://www.visualstudio.com/post-download-vs?sku=community ).

Do not use spaces in the path to the solution.

Once you've installed Visual Studio and (optionally) DirectX8 SDK, you can build the engine solution (`/Sources/All.sln`). Press F7 or Build -> Build solution. The libraries and executables will be put into `\Bin\` directory (or `\Bin\Debug\` if you are using the Debug configuration).

Optional features
-----------------

DirectX support is disabled by default. If you need DirectX support you'll have to download DirectX8 SDK (headers & libraries) ( http://files.seriouszone.com/download.php?fileid=759 or https://www.microsoft.com/en-us/download/details.aspx?id=6812 ) and then enable the SE1_D3D switch for all projects in the solution (Project properties -> Configuration properties -> C/C++ -> Preprocessor -> Preprocessor definitions -> Add "SE1_D3D" for both Debug and Release builds). You will also need to make sure the DirectX8 headers and libraries are located in the following folders (make the folder structure if it's not existing yet):
* `/Tools.Win32/Libraries/DX8SDK/Include/..`
* `/Tools.Win32/Libraries/DX8SDK/Lib/..`

MP3 playback is disabled by default. If you need this feature, you will have to copy amp11lib.dll to the '\Bin\' directory (and '\Bin\Debug\' for MP3 support in debug mode). The amp11lib.dll is distributed with older versions of Serious Sam: The First Encounter.

3D Exploration support is disabled in the open source version of Serious Engine 1 due to copyright issues. In case if you need to create new models you will have to either use editing tools from any of the original games, or write your own code for 3D object import/export.

IFeel support is disabled in the open source version of Serious Engine 1 due to copyright issues. In case if you need IFeel support you will have to copy IFC22.dll and ImmWrapper.dll from the original game into the `\Bin\` folder.

Running
-------

This version of the engine comes with a set of resources (`\SE1_10.GRO`) that allow you to freely use the engine without any additional resources required. However if you want to open or modify levels from Serious Sam Classic: The First Encounter or The Second Encounter (including most user-made levels), you will have to copy the game's resources (.GRO files) into the engine folder. You can buy the original games on Steam, as a part of a bundle with Serious Sam Revolution ( http://store.steampowered.com/app/227780 )

When running a selected project, make sure its project settings on Debugging is set to the right command:
* For debug:
    $(SolutionDir)..\Bin\Debug\$(TargetName).exe`
* For release:
    $(SolutionDir)..\Bin\$(TargetName).exe`
And its working directory:
    $(SolutionDir)..\

Common problems
---------------

Before starting the build process, make sure you have a "Temp" folder in your development directory. If it doesn't exist, create it.
SeriousSkaStudio has some issues with MFC windows that can prevent the main window from being displayed properly.

License
-------

Serious Engine is licensed under the GNU GPL v2 (see LICENSE file).

Some of the code included with the engine sources is not licensed under the GNU GPL v2:

* zlib (located in `Sources/Engine/zlib`) by Jean-loup Gailly and Mark Adler
* LightWave SDK (located in `Sources/LWSkaExporter/SDK`) by NewTek Inc.
* libogg/libvorbis (located in `Sources/libogg` and `Sources/libvorbis`) by Xiph.Org Foundation
