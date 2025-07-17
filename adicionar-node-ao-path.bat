@echo off
echo 🔧 Adicionando Node.js ao PATH do sistema...

:: Adicionar Node.js ao PATH do usuário
setx PATH "%PATH%;C:\Program Files\nodejs" /M

echo ✅ Node.js adicionado ao PATH!
echo 🔄 Reinicie o terminal para aplicar as mudanças.
echo.
echo 🧪 Teste digitando: node --version
pause 