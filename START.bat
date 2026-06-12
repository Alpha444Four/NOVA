@echo off

title NOVA Store

cd /d "%~dp0"



if not exist "node_modules\" (

  echo Installing server dependencies...

  call npm install

  if errorlevel 1 (

    echo Failed to install. Make sure Node.js is installed: https://nodejs.org/

    pause

    exit /b 1

  )

)



if not exist ".env" (

  echo Creating .env from .env.example...

  copy /Y ".env.example" ".env" >nul

)



if not exist "client\node_modules\" (

  echo Installing React client dependencies...

  call npm install --prefix client

)



if not exist "client\dist\index.html" (

  echo Building storefront UI bundle...

  call npm run build --prefix client

)



echo.

echo  ========================================

echo   NOVA Store - http://localhost:3000

echo  ========================================

echo   Shop:     http://localhost:3000

echo   Account:  http://localhost:3000/account

echo   Admin:    http://localhost:3000/admin.html

echo   Help:     http://localhost:3000/help.html

echo.

echo   Admin login: see .env (ADMIN_EMAIL / ADMIN_PASSWORD)

echo   Keep this window open while shopping.

echo   Press Ctrl+C to stop.

echo  ========================================

echo.



start "" http://localhost:3000

npm start

