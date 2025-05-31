if [ $(node -v | cut -f1 -d. | cut -f2 -dv) -lt 20 ]; then
  npm install --no-save require-at
  node test/old-node-test
else
  npm i -g fyn pnpm
  fyn
  fyn build
  fyn test:coverage
fi
