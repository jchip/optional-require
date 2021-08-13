if [ $(node -v | cut -f1 -d. | cut -f2 -dv) -lt 10 ]; then
  npm install --no-save require-at
  node test/old-node-test
else
  npm i -g fyn
  fyn
  fun coverage
fi
