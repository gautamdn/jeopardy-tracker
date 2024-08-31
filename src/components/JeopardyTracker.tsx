import React, { useState } from 'react';
import { CheckCircle, XCircle, Info, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const getAdditionalInfo = (answer: string) => {
  return `This is additional info about ${answer}.`;
};

const getStudyMaterial = async (answer: string) => {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is not set");
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: "You are a helpful assistant that provides study material for Jeopardy answers."
      }, {
        role: "user",
        content: `Provide study material for the Jeopardy answer: "${answer}". Include: 1) Key Points, 2) Related Topics, 3) Common Misconceptions, 4) Fun Fact, and 5) Study Tips.`
      }],
      max_tokens: 500
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

interface Answer {
  id: number;
  correct: boolean;
  answer: string;
  info?: string;
  studyMaterial?: string;
}

const JeopardyTracker: React.FC = () => {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showInfo, setShowInfo] = useState<number | null>(null);
  const [showStudyMaterial, setShowStudyMaterial] = useState<number | null>(null);
  const [missedAnswer, setMissedAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCorrectAnswer = () => {
    const newAnswer: Answer = {
      id: Date.now(),
      correct: true,
      answer: 'Correct Answer',
    };
    setAnswers([...answers, newAnswer]);
  };

  const addMissedAnswer = () => {
    if (!missedAnswer.trim()) return;
    const newAnswer: Answer = {
      id: Date.now(),
      correct: false,
      answer: missedAnswer,
    };
    setAnswers([...answers, newAnswer]);
    setMissedAnswer('');
  };

  const toggleInfo = (id: number) => {
    if (showInfo === id) {
      setShowInfo(null);
    } else {
      const answer = answers.find(a => a.id === id);
      if (answer && !answer.info) {
        const info = getAdditionalInfo(answer.answer);
        setAnswers(answers.map(a => a.id === id ? {...a, info} : a));
      }
      setShowInfo(id);
    }
  };

  const toggleStudyMaterial = async (id: number) => {
    if (showStudyMaterial === id) {
      setShowStudyMaterial(null);
    } else {
      setIsLoading(true);
      setError(null);
      const answer = answers.find(a => a.id === id);
      if (answer && !answer.studyMaterial) {
        try {
          const studyMaterial = await getStudyMaterial(answer.answer);
          setAnswers(answers.map(a => a.id === id ? {...a, studyMaterial} : a));
        } catch (error) {
          console.error("Error fetching study material:", error);
          setError("Failed to fetch study material. Please try again.");
        }
      }
      setShowStudyMaterial(id);
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Jeopardy Answer Tracker</h1>
      
      <div className="space-y-4 mb-4">
        <Button onClick={addCorrectAnswer} className="w-full flex items-center justify-center">
          <CheckCircle className="mr-2" />
          Add Correct Answer
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Add Missed Answer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="missedAnswer">Missed Answer</Label>
              <Input
                id="missedAnswer"
                value={missedAnswer}
                onChange={(e) => setMissedAnswer(e.target.value)}
                placeholder="Enter the missed answer"
              />
            </div>
            <Button onClick={addMissedAnswer} variant="destructive" className="w-full mt-4 flex items-center justify-center">
              <XCircle className="mr-2" />
              Add Missed Answer
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {answers.map((answer) => (
          <Card key={answer.id}>
            <CardHeader>
              <CardTitle className={`flex items-center ${answer.correct ? 'text-green-500' : 'text-red-500'}`}>
                {answer.correct ? <CheckCircle className="mr-2" /> : <XCircle className="mr-2" />}
                {answer.answer}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!answer.correct && (
                <div className="space-y-2">
                  <Button onClick={() => toggleInfo(answer.id)} variant="outline" className="flex items-center">
                    <Info className="mr-2" />
                    {showInfo === answer.id ? 'Hide Info' : 'Show Info'}
                  </Button>
                  <Button onClick={() => toggleStudyMaterial(answer.id)} variant="outline" className="flex items-center">
                    <BookOpen className="mr-2" />
                    {showStudyMaterial === answer.id ? 'Hide Study Material' : 'Show Study Material'}
                  </Button>
                </div>
              )}
              {showInfo === answer.id && answer.info && (
                <Alert className="mt-2">
                  <AlertTitle>Additional Information</AlertTitle>
                  <AlertDescription>{answer.info}</AlertDescription>
                </Alert>
              )}
              {showStudyMaterial === answer.id && (
                <Alert className="mt-2">
                  <AlertTitle>Study Material</AlertTitle>
                  <AlertDescription>
                    {isLoading ? (
                      <p>Loading study material...</p>
                    ) : error ? (
                      <p className="text-red-500">{error}</p>
                    ) : (
                      <pre className="whitespace-pre-wrap">{answer.studyMaterial}</pre>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default JeopardyTracker;