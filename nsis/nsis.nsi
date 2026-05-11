


; Chinese characters cannot be added
; Override default install dir

Function .onInit
    StrCpy $INSTDIR "$PROGRAMFILES64\lppxtaskmgr"
FunctionEnd
