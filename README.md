# med-zk server 


[![CI](https://github.com/mongodb-developer/mern-stack-example/actions/workflows/main.yaml/badge.svg)](https://github.com/mongodb-developer/mern-stack-example/actions/workflows/main.yaml)

## How To Run
Create the file `mern/server/config.env` with your Atlas URI and the server port:
```
ATLAS_URI=mongodb+srv://<username>:<password>@sandbox.jadwj.mongodb.net/
PORT=5050
ENCRYPTION_KEY=your_64_character_hex_key_here_32byteshexkey1234567890abcdef
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_super_secret_key
JWT_EXPIRY=1h # token expiration time
APIGEE_API_KEY=your_app_api_key

```

Using WSL you can generate encryption key by running the command below in your terminal.
```bash
openssl rand -hex 32
```

Using docker, build the containers from the source directory where you find docker-compose.yml file.

```bash
docker-compose pull
```

then run the containers

```bash
docker-compose up -d
```

Verify containers are running

```bash
docker-compose ps
```

To view the server logs run

```bash
docker-compose logs server
```



change the script in the server package.json to
```bash
"scripts": {
    "start": "nodemon --env-file=config.env server", 
    "test": "echo \"Error: no test specified\" && exit 1"
  }
```
If you're not running with docker.

Start server:
```
cd mern/server
yarn
yarn start
```

Start Web server
```
cd mern/client
yarn
yarn dev
```
