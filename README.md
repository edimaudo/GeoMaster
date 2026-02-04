# GeoMaster Reddit Quiz

An interactive geography trivia game built for Reddit using Devvit. Players identify mystery countries based on natural language profiles including verified GDP, population, and lifestyle data.

## Features

- **Guesser Mode**: Detailed country profiles based on verified CIA World Factbook data.

- **Dynamic Scoring**: A time-based scoring system with time penalties for incorrect guesses.

- **Responsive Blocks UI**: Designed to look native across Reddit's web and mobile interfaces.



## Technical Setup

### Prerequisites

- Node.js (v18 or higher)

- Reddit Devvit CLI

## Installation

1) Install the Devvit CLI:
```
npm install -g @devvit/cli
```

2) Log in to your Reddit account:
```
devvit login
```

## Deployment

1) Navigate to the project folder:
```
cd geomaster
```

2) Install dependencies:
```
npm install
```

3) Create a new app on Reddit:
```
devvit new geomaster-quiz
```

4) Upload and playtest:
```
devvit upload
```

## Data Sources

- Economy & Population: CIA World Factbook (2024 Estimates).

- Consumption Stats: WHO & Kirin Holdings Global Beer Report.
