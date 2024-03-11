Button
 Name: TTRS Move Forward
 Key1: W
 Key2: Arrow Up
 Pressed:  ctl_bMoveForward = 1;
 Released: ctl_bMoveForward = 0;
Button
 Name: TTRS Move Backward
 Key1: S
 Key2: Arrow Down
 Pressed:  ctl_bMoveBackward = 1;
 Released: ctl_bMoveBackward = 0;
Button
 Name: TTRS Strafe Left
 Key1: A
 Key2: None
 Pressed:  ctl_bMoveLeft = 1;
 Released: ctl_bMoveLeft = 0;
Button
 Name: TTRS Strafe Right
 Key1: D
 Key2: None
 Pressed:  ctl_bMoveRight = 1;
 Released: ctl_bMoveRight = 0;
Button
 Name: TTRS Up/Jump
 Key1: Space
 Key2: None
 Pressed:  ctl_bMoveUp = 1;
 Released: ctl_bMoveUp = 0;
Button
 Name: TTRS Down/Duck
 Key1: Left Control
 Key2: None
 Pressed:  ctl_bMoveDown = 1;
 Released: ctl_bMoveDown = 0;
Button
 Name: TTRS Turn Left
 Key1: None
 Key2: None
 Pressed:  ctl_bTurnLeft = 1;
 Released: ctl_bTurnLeft = 0;
Button
 Name: TTRS Turn Right
 Key1: None
 Key2: None
 Pressed:  ctl_bTurnRight = 1;
 Released: ctl_bTurnRight = 0;
Button
 Name: TTRS Look Up
 Key1: Mouse Button 4
 Key2: None
 Pressed:  ctl_bTurnUp = 1;
 Released: ctl_bTurnUp = 0;
Button
 Name: TTRS Look Down
 Key1: Mouse Button 5
 Key2: None
 Pressed:  ctl_bTurnDown = 1;
 Released: ctl_bTurnDown = 0;
Button
 Name: TTRS Center View
 Key1: Home
 Key2: None
 Pressed:  ctl_bCenterView = 1;
 Released: ctl_bCenterView = 0;
Button
 Name: TTRS Walk
 Key1: Left Shift
 Key2: None
 Pressed:  ctl_bRun = !ctl_bRun;
 Released: ctl_bRun = !ctl_bRun;
Button
 Name: TTRS Strafe
 Key1: None
 Key2: None
 Pressed:  ctl_bStrafe = 1;
 Released: ctl_bStrafe = 0;
Button
 Name: TTRS Fire
 Key1: Mouse Button 1
 Key2: None
 Pressed:  ctl_bFire = 1;
 Released: ctl_bFire = 0;
Button
 Name: TTRS AltFire
 Key1: Mouse Button 2
 Key2: None
 Pressed:  ctl_bAltFire = 1;
 Released: ctl_bAltFire = 0;
Button
 Name: TTRS Reload
 Key1: R
 Key2: None
 Pressed:  ctl_bReload = 1;
 Released: ctl_bReload = 0;
Button
 Name: TTRS Holster
 Key1: H
 Key2: None
 Pressed:  ctl_bHolster = 1;
 Released: ctl_bHolster = 0;
Button
 Name: TTRS Drop Weapon
 Key1: G
 Key2: None
 Pressed:  ctl_bDropWeapon = 1;
 Released: ctl_bDropWeapon = 0;
Button
 Name: TTRS 3rd Person View
 Key1: C
 Key2: None
 Pressed:  ctl_b3rdPersonView = 1;
 Released: ctl_b3rdPersonView = 0;
Button
 Name: TTRS Use
 Key1: E
 Key2: None
 Pressed:  ctl_bUse = 1;
 Released: ctl_bUse = 0;
Button
 Name: TTRS Talk
 Key1: T
 Key2: None
 Pressed:  con_bTalk=1;
 Released: 
Button
 Name: TTRS Previous Weapon
 Key1: Mouse Wheel Up
 Key2: [
 Pressed:  ctl_bWeaponPrev = 1;
 Released: ctl_bWeaponPrev = 0;
Button
 Name: TTRS Next Weapon
 Key1: Mouse Wheel Down
 Key2: ]
 Pressed:  ctl_bWeaponNext = 1;
 Released: ctl_bWeaponNext = 0;
Button
 Name: TTRS Flip Weapon
 Key1: Mouse Button 3
 Key2: None
 Pressed:  ctl_bWeaponFlip = 1;
 Released: ctl_bWeaponFlip = 0;
Button
 Name: TTRS Knife/Axe
 Key1: 1
 Key2: None
 Pressed:  ctl_bSelectWeapon[1] = 1;
 Released: ctl_bSelectWeapon[1] = 0;
Button
 Name: TTRS Pistol/Strong Pistol
 Key1: 2
 Key2: None
 Pressed:  ctl_bSelectWeapon[2] = 1;
 Released: ctl_bSelectWeapon[2] = 0;
Button
 Name: TTRS Shotgun/Submachine Gun
 Key1: 3
 Key2: None
 Pressed:  ctl_bSelectWeapon[3] = 1;
 Released: ctl_bSelectWeapon[3] = 0;
Button
 Name: TTRS Semi-Automatic Rifle
 Key1: 4
 Key2: None
 Pressed:  ctl_bSelectWeapon[4] = 1;
 Released: ctl_bSelectWeapon[4] = 0;
Button
 Name: TTRS Grenade/Dynamite
 Key1: 5
 Key2: None
 Pressed:  ctl_bSelectWeapon[5] = 1;
 Released: ctl_bSelectWeapon[5] = 0;
Button
 Name: TTRS Painkillers
 Key1: 0
 Key2: None
 Pressed:  ctl_bUsePainkillers = 1;
 Released: ctl_bUsePainkillers = 0;
Button
 Name: TTRS Strafe Left
 Key1: Arrow Left
 Key2: None
 Pressed:  ctl_bMoveLeft = 1;
 Released: ctl_bMoveLeft = 0;
Button
 Name: TTRS Strafe Right
 Key1: Arrow Right
 Key2: None
 Pressed:  ctl_bMoveRight = 1;
 Released: ctl_bMoveRight = 0;
Axis "move u/d" "None" 50 0 NotInverted Absolute NotSmooth
Axis "move l/r" "None" 50 0 NotInverted Absolute NotSmooth
Axis "move f/b" "None" 50 0 NotInverted Absolute NotSmooth
Axis "look u/d" "mouse Y" 50 0 NotInverted Relative NotSmooth
Axis "turn l/r" "mouse X" 50 0 NotInverted Relative NotSmooth
Axis "banking" "None" 50 0 NotInverted Absolute NotSmooth
Axis "view u/d" "None" 50 0 NotInverted Absolute NotSmooth
Axis "view l/r" "None" 50 0 NotInverted Absolute NotSmooth
Axis "view banking" "None" 50 0 NotInverted Absolute NotSmooth
GlobalDontInvertLook
GlobalSmoothAxes
GlobalSensitivity 50
