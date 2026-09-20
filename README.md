# Nakama main server plugin
A plugin for Nakama to make it work with the OpenHellion project.

The main server handles player accounts and a server list. It is not in a production-ready state [(and might get scrapped)](https://github.com/OpenHellion/Nakama/issues/3). It is required to run the game, even singleplayer.

[Read more...](https://openhellion.github.io/documentation/clientserver-overview)

## How to run
1. Download [Node.js](https://nodejs.org/en), [Docker](https://docker.com) and [Docker Compose](https://docs.docker.com/compose/).
2. Download this repository through Git or as a zip.
3. Open the downloaded directory in a command line and run `npm run serve`.

## Common errors
* `unable to get image 'postgres': error during connect` or `unable to get image 'heroiclabs/nakama': error during connect`: Check if Docker is up and running.
