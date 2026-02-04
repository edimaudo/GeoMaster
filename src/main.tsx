import { Devvit, useState, useAsync } from '@devvit/public-api';

// Verified data from CIA World Factbook & World Health Organization
const COUNTRIES = [
  { code: 'ca', name: 'Canada', capital: 'Ottawa', gdp: '$2.38 trillion', pop: '38.9 million', beer: '57 liters' },
  { code: 'us', name: 'United States', capital: 'Washington, D.C.', gdp: '$25.46 trillion', pop: '333.3 million', beer: '73 liters' },
  { code: 'gb', name: 'United Kingdom', capital: 'London', gdp: '$3.07 trillion', pop: '67.0 million', beer: '70 liters' },
  { code: 'fr', name: 'France', capital: 'Paris', gdp: '$2.78 trillion', pop: '67.8 million', beer: '33 liters' },
  { code: 'de', name: 'Germany', capital: 'Berlin', gdp: '$4.07 trillion', pop: '83.2 million', beer: '92 liters' },
  { code: 'jp', name: 'Japan', capital: 'Tokyo', gdp: '$4.23 trillion', pop: '124.6 million', beer: '38 liters' },
  { code: 'br', name: 'Brazil', capital: 'Brasília', gdp: '$1.92 trillion', pop: '214.3 million', beer: '60 liters' },
  { code: 'au', name: 'Australia', capital: 'Canberra', gdp: '$1.69 trillion', pop: '25.7 million', beer: '71 liters' },
  { code: 'in', name: 'India', capital: 'New Delhi', gdp: '$3.41 trillion', pop: '1.41 billion', beer: '2 liters' },
  { code: 'cn', name: 'China', capital: 'Beijing', gdp: '$17.96 trillion', pop: '1.41 billion', beer: '29 liters' },
  { code: 'it', name: 'Italy', capital: 'Rome', gdp: '$2.01 trillion', pop: '59.1 million', beer: '31 liters' },
  { code: 'mx', name: 'Mexico', capital: 'Mexico City', gdp: '$1.41 trillion', pop: '126.7 million', beer: '68 liters' },
  { code: 'za', name: 'South Africa', capital: 'Pretoria', gdp: '$405 billion', pop: '59.3 million', beer: '60 liters' },
  { code: 'kr', name: 'South Korea', capital: 'Seoul', gdp: '$1.67 trillion', pop: '51.7 million', beer: '39 liters' },
  { code: 'es', name: 'Spain', capital: 'Madrid', gdp: '$1.40 trillion', pop: '47.4 million', beer: '50 liters' },
  { code: 'ar', name: 'Argentina', capital: 'Buenos Aires', gdp: '$632 billion', pop: '45.8 million', beer: '41 liters' },
  { code: 'ng', name: 'Nigeria', capital: 'Abuja', gdp: '$477 billion', pop: '213.4 million', beer: '12 liters' },
  { code: 'eg', name: 'Egypt', capital: 'Cairo', gdp: '$476 billion', pop: '109.3 million', beer: '0.2 liters' },
  { code: 'se', name: 'Sweden', capital: 'Stockholm', gdp: '$585 billion', pop: '10.4 million', beer: '50 liters' },
  { code: 'cz', name: 'Czechia', capital: 'Prague', gdp: '$290 billion', pop: '10.5 million', beer: '140 liters' },
  { code: 'ie', name: 'Ireland', capital: 'Dublin', gdp: '$529 billion', pop: '5.0 million', beer: '95 liters' },
  { code: 'be', name: 'Belgium', capital: 'Brussels', gdp: '$578 billion', pop: '11.6 million', beer: '65 liters' },
  { code: 'nl', name: 'Netherlands', capital: 'Amsterdam', gdp: '$991 billion', pop: '17.5 million', beer: '69 liters' },
  { code: 'ch', name: 'Switzerland', capital: 'Bern', gdp: '$807 billion', pop: '8.7 million', beer: '55 liters' },
  { code: 'nz', name: 'New Zealand', capital: 'Wellington', gdp: '$248 billion', pop: '5.1 million', beer: '61 liters' }
];

Devvit.configure({
  redditAPI: true,
  redis: true,
});

Devvit.addCustomPostType({
  name: 'GeoMaster Quiz',
  render: (context) => {
    const { redis, userId } = context;

    // Game State
    const [page, setPage] = useState('menu'); 
    const [mode, setMode] = useState<string>('country');
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [penalty, setPenalty] = useState(0);
    const [questions, setQuestions] = useState<any[]>([]);
    const [options, setOptions] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isNewRecord, setIsNewRecord] = useState(false);

    // Helpers
    const getFlagUrl = (code: string) => `https://flagcdn.com/w320/${code}.png`;

    // Fetch Best Times for ALL modes
    const { data: bestTimes, loading: loadingBest, refetch: refetchBest } = useAsync(async () => {
      if (!userId) return { country: null, flag: null, capital: null, guesser: null };
      const [country, flag, capital, guesser] = await Promise.all([
        redis.get(`best_time_country_${userId}`),
        redis.get(`best_time_flag_${userId}`),
        redis.get(`best_time_capital_${userId}`),
        redis.get(`best_time_guesser_${userId}`)
      ]);
      return {
        country: country ? parseFloat(country) : null,
        flag: flag ? parseFloat(flag) : null,
        capital: capital ? parseFloat(capital) : null,
        guesser: guesser ? parseFloat(guesser) : null,
      };
    });

    const setupQuestion = (questionList: any[], index: number) => {
        const correct = questionList[index];
        const wrongs = COUNTRIES.filter((c) => c.code !== correct.code)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);
        const shuffledOptions = [...wrongs, correct].sort(() => 0.5 - Math.random());
        setOptions(shuffledOptions);
    };

    const startGame = (selectedMode: string) => {
      const shuffled = [...COUNTRIES].sort(() => 0.5 - Math.random()).slice(0, 7); // 7 Questions
      setQuestions(shuffled);
      setMode(selectedMode);
      setStartTime(Date.now());
      setPenalty(0);
      setCurrentQuestion(0);
      setIsNewRecord(false);
      setPage('playing');
      setFeedback(null);
      
      const correct = shuffled[0];
      const wrongs = COUNTRIES.filter((c) => c.code !== correct.code)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
      setOptions([...wrongs, correct].sort(() => 0.5 - Math.random()));
    };

    const handleAnswer = async (answerCode: string) => {
      const correct = questions[currentQuestion];
      let currentPenalty = penalty;

      if (answerCode === correct.code) {
        setFeedback('Correct!');
      } else {
        setFeedback('Wrong! +10s Penalty');
        currentPenalty += 10000;
        setPenalty(currentPenalty);
      }

      setTimeout(async () => {
        if (currentQuestion < questions.length - 1) {
          const nextQ = currentQuestion + 1;
          setCurrentQuestion(nextQ);
          setupQuestion(questions, nextQ);
          setFeedback(null);
        } else {
          // Game Over
          const finalTimeMs = Date.now() - startTime + currentPenalty;
          const finalTimeSec = finalTimeMs / 1000;
          setScore(finalTimeMs);
          
          if (userId) {
            const currentBestStr = await redis.get(`best_time_${mode}_${userId}`);
            const currentBest = currentBestStr ? parseFloat(currentBestStr) : null;
            
            if (currentBest === null || finalTimeSec < currentBest) {
              await redis.set(`best_time_${mode}_${userId}`, finalTimeSec.toString());
              setIsNewRecord(true);
              refetchBest(); // Update menu scores for next time
            }
          }
          setPage('results');
        }
      }, 1500);
    };

    const clearScores = async () => {
      if (userId) {
        await Promise.all([
            redis.del(`best_time_country_${userId}`),
            redis.del(`best_time_flag_${userId}`),
            redis.del(`best_time_capital_${userId}`),
            redis.del(`best_time_guesser_${userId}`)
        ]);
        refetchBest();
        setPage('menu');
      }
    };

    // --- Views ---

    const Menu = (
      <vstack alignment="middle center" gap="medium" padding="large" height="100%">
        <text size="xxlarge" weight="bold">GeoMaster</text>
        <text size="medium" color="secondary">Select Game Mode</text>
        
        <vstack gap="small" width="100%" maxWidth="300px">
            <button icon="world" appearance="secondary" onPress={() => startGame('country')}>Country Mode</button>
            <button icon="image" appearance="secondary" onPress={() => startGame('flag')}>Flag Mode</button>
            <button icon="location" appearance="secondary" onPress={() => startGame('capital')}>Capital Mode</button>
            <button icon="search" appearance="secondary" onPress={() => startGame('guesser')}>Guesser Mode</button>
        </vstack>

        <vstack backgroundColor="neutral-background-weak" padding="medium" cornerRadius="medium" width="100%" maxWidth="300px">
            <text size="small" weight="bold" color="secondary">PERSONAL BESTS</text>
            <hstack alignment="middle space-between">
                <text size="small">Country:</text>
                <text size="small" weight="bold">{bestTimes?.country ? `${bestTimes.country.toFixed(2)}s` : '--'}</text>
            </hstack>
            <hstack alignment="middle space-between">
                <text size="small">Flag:</text>
                <text size="small" weight="bold">{bestTimes?.flag ? `${bestTimes.flag.toFixed(2)}s` : '--'}</text>
            </hstack>
            <hstack alignment="middle space-between">
                <text size="small">Capital:</text>
                <text size="small" weight="bold">{bestTimes?.capital ? `${bestTimes.capital.toFixed(2)}s` : '--'}</text>
            </hstack>
            <hstack alignment="middle space-between">
                <text size="small">Guesser:</text>
                <text size="small" weight="bold">{bestTimes?.guesser ? `${bestTimes.guesser.toFixed(2)}s` : '--'}</text>
            </hstack>
        </vstack>

        <button icon="settings" appearance="ghost" onPress={() => setPage('settings')}>
          Settings
        </button>
      </vstack>
    );

    const Settings = (
        <vstack alignment="middle center" gap="medium" padding="large" height="100%">
            <text size="large" weight="bold">Settings</text>
            <vstack gap="small" alignment="middle center">
                <text size="small" color="secondary">Erase all your personal best times?</text>
                <button appearance="destructive" onPress={clearScores}>Clear All Scores</button>
            </vstack>
            <button appearance="secondary" onPress={() => setPage('menu')}>Back</button>
        </vstack>
    );

    const Playing = () => {
      const country = questions[currentQuestion];
      if (!country) return <text>Loading...</text>;

      let QuestionHeader;
      let OptionGrid;

      // MODE: Country (Name -> Flags)
      if (mode === 'country') {
        QuestionHeader = (
            <vstack alignment="center middle" gap="small">
                <text size="large" weight="bold">{country.name}</text>
                <text size="small">Select the correct flag</text>
            </vstack>
        );
        OptionGrid = (
            <vstack gap="small" width="100%">
                <hstack gap="small" width="100%">
                    <image url={getFlagUrl(options[0].code)} imageWidth={140} imageHeight={93} resizeMode='cover' onPress={() => handleAnswer(options[0].code)} />
                    <image url={getFlagUrl(options[1].code)} imageWidth={140} imageHeight={93} resizeMode='cover' onPress={() => handleAnswer(options[1].code)} />
                </hstack>
                <hstack gap="small" width="100%">
                    <image url={getFlagUrl(options[2].code)} imageWidth={140} imageHeight={93} resizeMode='cover' onPress={() => handleAnswer(options[2].code)} />
                    <image url={getFlagUrl(options[3].code)} imageWidth={140} imageHeight={93} resizeMode='cover' onPress={() => handleAnswer(options[3].code)} />
                </hstack>
            </vstack>
        );
      }
      // MODE: Flag (Flag -> Names)
      else if (mode === 'flag') {
        QuestionHeader = (
            <vstack alignment="center middle" gap="small">
                <image url={getFlagUrl(country.code)} imageWidth={200} imageHeight={133} resizeMode='cover' />
                <text size="small">Which country is this?</text>
            </vstack>
        );
        OptionGrid = (
            <vstack gap="small" width="100%">
                {options.map((opt) => (
                    <button onPress={() => handleAnswer(opt.code)} appearance="secondary" width="100%">{opt.name}</button>
                ))}
            </vstack>
        );
      }
      // MODE: Capital (Capital -> Flags)
      else if (mode === 'capital') {
        QuestionHeader = (
            <vstack alignment="center middle" gap="small">
                <text size="large" weight="bold">{country.capital}</text>
                <text size="small">Select the country for this capital</text>
            </vstack>
        );
        OptionGrid = (
            <vstack gap="small" width="100%">
                <hstack gap="small" width="100%">
                    <image url={getFlagUrl(options[0].code)} imageWidth={140} imageHeight={93} resizeMode='cover' onPress={() => handleAnswer(options[0].code)} />
                    <image url={getFlagUrl(options[1].code)} imageWidth={140} imageHeight={93} resizeMode='cover' onPress={() => handleAnswer(options[1].code)} />
                </hstack>
                <hstack gap="small" width="100%">
                    <image url={getFlagUrl(options[2].code)} imageWidth={140} imageHeight={93} resizeMode='cover' onPress={() => handleAnswer(options[2].code)} />
                    <image url={getFlagUrl(options[3].code)} imageWidth={140} imageHeight={93} resizeMode='cover' onPress={() => handleAnswer(options[3].code)} />
                </hstack>
            </vstack>
        );
      }
      // MODE: Guesser (Facts -> Names)
      else {
        QuestionHeader = (
            <vstack backgroundColor="neutral-background-weak" padding="medium" cornerRadius="medium" gap="small" border="thin">
                <text size="medium" weight="bold">Mystery Country Profile</text>
                <text wrap>This nation is home to a population of approximately {country.pop}.</text>
                <text wrap>Its economy is significant, with a GDP reaching {country.gdp}.</text>
                <text wrap>The political heart of the country is located in its capital, {country.capital}.</text>
                <text wrap>On average, citizens consume about {country.beer} of beer annually.</text>
            </vstack>
        );
        OptionGrid = (
            <vstack gap="small" width="100%">
                {options.map((opt) => (
                    <button onPress={() => handleAnswer(opt.code)} appearance="secondary" width="100%">{opt.name}</button>
                ))}
            </vstack>
        );
      }

      return (
        <vstack gap="medium" padding="medium" alignment="top center" height="100%">
          <hstack width="100%" alignment="middle space-between">
            <text size="small" weight="bold">Question {currentQuestion + 1}/7</text>
            <text size="small" color="danger">Penalty: {penalty / 1000}s</text>
          </hstack>

          {QuestionHeader}

          <zstack height="24px" alignment="middle center">
            {feedback && (
                <text weight="bold" color={feedback.startsWith('Correct') ? 'success' : 'danger'}>
                {feedback}
                </text>
            )}
          </zstack>

          {OptionGrid}
        </vstack>
      );
    };

    const Results = (
      <vstack alignment="middle center" gap="medium" padding="large" height="100%">
        <text size="xlarge" weight="bold">Finished!</text>
        <vstack alignment="middle center">
            <text size="large">Final Time: {(score / 1000).toFixed(2)}s</text>
            {isNewRecord && (
                <hstack gap="small" alignment="middle center">
                    <icon name="star-fill" color="warning" size="small" />
                    <text color="warning" weight="bold">New Personal Best!</text>
                </hstack>
            )}
        </vstack>
        <button icon="refresh" onPress={() => setPage('menu')}>Back to Menu</button>
      </vstack>
    );

    return (
      <zstack width="100%" height="100%" alignment="middle center">
        {page === 'menu' && Menu}
        {page === 'settings' && Settings}
        {page === 'playing' && Playing()}
        {page === 'results' && Results}
      </zstack>
    );
  },
});

export default Devvit;
