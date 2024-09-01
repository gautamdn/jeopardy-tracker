import React, { useState } from 'react';
import { XCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

const getStudyMaterial = async (answer: string) => {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is not set");
  }

  try {
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
      const errorData = await response.json();
      console.error("API Error:", errorData);
      throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error in getStudyMaterial:", error);
    throw error;
  }
};

interface Answer {
  id: number;
  correct: boolean;
  answer: string;
  studyMaterial?: string;
  showStudyMaterial: boolean;
  date: string;  // Automatically tracked date
}

const JeopardyTracker: React.FC = () => {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [missedAnswer, setMissedAnswer] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMissedAnswer = () => {
    if (!missedAnswer.trim()) return;
    const newAnswer: Answer = {
      id: Date.now(),
      correct: false,
      answer: missedAnswer,
      showStudyMaterial: false,
      date: format(new Date(), 'yyyy-MM-dd'), // Automatically track the current date
    };
    setAnswers([...answers, newAnswer]);
    setMissedAnswer('');
  };

  const toggleStudyMaterial = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedAnswers = await Promise.all(
        answers.map(async a => {
          if (a.id === id) {
            const studyMaterial = a.studyMaterial || await getStudyMaterial(a.answer);
            return { ...a, showStudyMaterial: !a.showStudyMaterial, studyMaterial };
          }
          return a;
        })
      );
      setAnswers(updatedAnswers);
    } catch (error) {
      console.error("Error fetching study material:", error);
      setError("Failed to fetch study material. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAnswers = selectedDate
    ? answers.filter(answer => answer.date === selectedDate)
    : answers;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Jeopardy Answer Tracker</h1>
      
      <div className="space-y-4 mb-4">
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
            <Button
              onClick={addMissedAnswer}
              variant="destructive"
              className="w-full mt-4 flex items-center justify-center"
              disabled={!missedAnswer.trim()}
            >
              <XCircle className="mr-2" />
              Add Missed Answer
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 mb-4">
        <Label htmlFor="datePicker">Filter by Date</Label>
        <Input
          id="datePicker"
          type="date"
          value={selectedDate || ''}
          onChange={(e) => setSelectedDate(e.target.value)}
          placeholder="Select a date"
        />
        <Button
          onClick={() => setSelectedDate(null)}
          variant="outline"
          className="w-full mt-2"
        >
          Clear Date Filter
        </Button>
      </div>

      <div className="space-y-4">
        {filteredAnswers.map((answer) => (
          <Card key={answer.id}>
            <CardHeader>
              <CardTitle className={`flex items-center text-red-500`}>
                <XCircle className="mr-2" />
                {answer.answer} (Added on {answer.date})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  onClick={() => toggleStudyMaterial(answer.id)}
                  variant="outline"
                  className="flex items-center"
                  disabled={isLoading}
                >
                  <BookOpen className="mr-2" />
                  {answer.showStudyMaterial ? 'Hide Study Material' : 'Show Study Material'}
                </Button>
              </div>
              {answer.showStudyMaterial && (
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
