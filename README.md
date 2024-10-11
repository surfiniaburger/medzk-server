# med-zk server 


[![CI](https://github.com/mongodb-developer/mern-stack-example/actions/workflows/main.yaml/badge.svg)](https://github.com/mongodb-developer/mern-stack-example/actions/workflows/main.yaml)

## How To Run
Create the file `mern/server/config.env` with your Atlas URI and the server port:
```
ATLAS_URI=mongodb+srv://<username>:<password>@sandbox.jadwj.mongodb.net/
PORT=5050
ENCRYPTION_KEY=your_64_character_hex_key_here_32byteshexkey1234567890abcdef
GEMINI_API_KEY=your_gemini_api_key
SENTRY_DSN=your_sentry_dsn
```

Using WSL you can generate encryption key by running the command below in your terminal.
```bash
openssl rand -hex 32
```

Start server:
```
cd mern/server
yarn
yarn start
```

Start Web server
```
cd mern/client
npm install
npm run dev
```
