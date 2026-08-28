'use client';

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Keyboard, RotateCcw, Sparkles, Trophy, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

type Mode = 'choice' | 'fill';
type Question = { left: number; right: number; answer: number; options: number[] };

const ROUND_LENGTH = 10;
const INITIAL_QUESTION: Question = { left: 6, right: 7, answer: 42, options: [36, 42, 48, 49] };

function makeQuestion(previous?: Question): Question {
  let left = 2 + Math.floor(Math.random() * 11);
  let right = 2 + Math.floor(Math.random() * 11);

  while (previous && left === previous.left && right === previous.right) {
    left = 2 + Math.floor(Math.random() * 11);
    right = 2 + Math.floor(Math.random() * 11);
  }

  const answer = left * right;
  const distractors = new Set<number>();
  const candidates = [answer + left, answer - left, answer + right, answer - right, (left + 1) * right, left * Math.max(2, right - 1)].filter(
    (value) => value > 0 && value !== answer,
  );

  for (const value of candidates.sort(() => Math.random() - 0.5)) {
    distractors.add(value);
    if (distractors.size === 3) break;
  }

  while (distractors.size < 3) {
    const offset = Math.ceil(Math.random() * 12) * (Math.random() > 0.5 ? 1 : -1);
    if (answer + offset > 0) distractors.add(answer + offset);
  }

  return { left, right, answer, options: [answer, ...distractors].sort(() => Math.random() - 0.5) };
}

export default function Home() {
  const [mode, setMode] = useState<Mode>('choice');
  const [question, setQuestion] = useState<Question>(INITIAL_QUESTION);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [complete, setComplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const progress = useMemo(() => (complete ? 100 : ((questionNumber - 1) / ROUND_LENGTH) * 100), [complete, questionNumber]);

  useEffect(() => {
    if (mode === 'fill' && isCorrect === null && !complete) inputRef.current?.focus();
  }, [mode, question, isCorrect, complete]);

  useEffect(() => {
    if (mode !== 'choice' || isCorrect !== null || complete) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const optionIndex = Number(event.key) - 1;
      if (optionIndex >= 0 && optionIndex < question.options.length) recordAnswer(question.options[optionIndex]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, isCorrect, complete, question]);

  function recordAnswer(value: number) {
    if (isCorrect !== null) return;
    const correct = value === question.answer;
    const nextStreak = correct ? streak + 1 : 0;
    setSelected(value);
    setIsCorrect(correct);
    setScore((current) => current + (correct ? 1 : 0));
    setStreak(nextStreak);
    setBestStreak((current) => Math.max(current, nextStreak));
  }

  function submitTypedAnswer(event: FormEvent) {
    event.preventDefault();
    if (typedAnswer.trim() === '') return;
    recordAnswer(Number(typedAnswer));
  }

  function nextQuestion() {
    if (questionNumber === ROUND_LENGTH) {
      setComplete(true);
      return;
    }
    setQuestion((current) => makeQuestion(current));
    setQuestionNumber((current) => current + 1);
    setSelected(null);
    setTypedAnswer('');
    setIsCorrect(null);
  }

  function startRound(nextMode = mode) {
    setMode(nextMode);
    setQuestion(makeQuestion());
    setQuestionNumber(1);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setSelected(null);
    setTypedAnswer('');
    setIsCorrect(null);
    setComplete(false);
  }

  const feedbackId = 'answer-feedback';

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,209,102,.26),transparent_25%),radial-gradient(circle_at_90%_84%,rgba(66,184,131,.18),transparent_28%)]" />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="grid size-10 rotate-[-5deg] place-items-center rounded-xl bg-primary text-lg font-black text-primary-foreground shadow-[3px_3px_0_#17233c]">×</span>
          <span className="text-lg font-black tracking-[-0.03em]">Fact Pop!</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border-2 border-foreground/10 bg-white/70 px-4 py-2 text-sm font-bold shadow-sm backdrop-blur">
          <Sparkles className="size-4 text-[#d2691e]" aria-hidden="true" />
          Streak <span className="tabular-nums text-primary">{streak}</span>
        </div>
      </header>

      <section className="relative mx-auto grid w-full max-w-6xl gap-8 px-5 pb-12 pt-2 lg:grid-cols-[minmax(0,1fr)_290px] lg:px-8 lg:pt-8">
        <div>
          <div className="mb-7 max-w-xl">
            <p className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-[#aa4b18]">Quick multiplication practice</p>
            <h1 className="text-balance text-4xl font-black leading-[1.02] tracking-[-0.055em] sm:text-6xl">
              Make those facts <span className="relative whitespace-nowrap text-primary">stick!<span className="absolute -bottom-1 left-0 h-2 w-full -rotate-1 rounded-full bg-[#ffd166]/70" /></span>
            </h1>
          </div>

          <div className="rounded-[28px] border-2 border-foreground/10 bg-card p-4 shadow-[0_18px_0_-8px_rgba(23,35,60,.12)] sm:p-7">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex w-fit rounded-xl bg-muted p-1" aria-label="Answer mode">
                <button type="button" onClick={() => mode !== 'choice' && startRound('choice')} className={`rounded-lg px-4 py-2 text-sm font-extrabold transition ${mode === 'choice' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`} aria-pressed={mode === 'choice'}>
                  Multiple choice
                </button>
                <button type="button" onClick={() => mode !== 'fill' && startRound('fill')} className={`rounded-lg px-4 py-2 text-sm font-extrabold transition ${mode === 'fill' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`} aria-pressed={mode === 'fill'}>
                  Fill it in
                </button>
              </div>
              <span className="text-sm font-bold text-muted-foreground">Question {Math.min(questionNumber, ROUND_LENGTH)} of {ROUND_LENGTH}</span>
            </div>

            <Progress value={progress} aria-label={`${Math.round(progress)} percent complete`} className="mb-8 [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-[#e9e4d9] [&_[data-slot=progress-indicator]]:bg-primary" />

            {complete ? (
              <div className="flex min-h-[350px] flex-col items-center justify-center py-8 text-center">
                <div className="mb-5 grid size-20 place-items-center rounded-full bg-[#ffd166] text-[#6d4310] shadow-[0_8px_0_#e9ad32]"><Trophy className="size-10" aria-hidden="true" /></div>
                <p className="mb-2 text-sm font-black uppercase tracking-[0.16em] text-[#aa4b18]">Round complete</p>
                <h2 className="text-4xl font-black tracking-[-0.04em]">You got {score} out of {ROUND_LENGTH}!</h2>
                <p className="mt-3 max-w-sm text-muted-foreground">{score === ROUND_LENGTH ? 'Perfect score — those facts are popping!' : score >= 7 ? 'Great work. One more round will make them even faster.' : 'Every try builds stronger math muscles. Keep going!'}</p>
                <Button onClick={() => startRound()} size="lg" className="mt-7 h-12 rounded-xl px-6 text-base font-extrabold shadow-[0_5px_0_#244e45] hover:translate-y-0.5 hover:shadow-[0_3px_0_#244e45]"><RotateCcw className="size-4" /> Play another round</Button>
              </div>
            ) : (
              <div className="min-h-[350px]">
                <p className="text-center text-sm font-bold text-muted-foreground">What is the product?</p>
                <div className="my-7 flex items-center justify-center gap-4 text-6xl font-black tracking-[-0.05em] sm:text-7xl">
                  <span>{question.left}</span><span className="text-[#d2691e]">×</span><span>{question.right}</span><span className="text-muted-foreground">=</span><span className="text-primary">?</span>
                </div>

                {mode === 'choice' ? (
                  <div className="mx-auto grid max-w-xl grid-cols-2 gap-3">
                    {question.options.map((option, index) => {
                      const answered = isCorrect !== null;
                      const correctOption = option === question.answer;
                      const wrongSelected = answered && selected === option && !correctOption;
                      return (
                        <button key={option} type="button" onClick={() => recordAnswer(option)} disabled={answered} aria-describedby={answered ? feedbackId : undefined} className={`group relative min-h-20 rounded-2xl border-2 px-5 text-2xl font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 disabled:opacity-100 ${correctOption && answered ? 'border-[#2f806f] bg-[#d9f3e9] text-[#1d594e]' : wrongSelected ? 'border-[#d15a4a] bg-[#fde3df] text-[#91372c]' : 'border-foreground/10 bg-[#fffdf7] hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md'}`}>
                          <span className="absolute left-3 top-3 text-[11px] font-bold text-muted-foreground">{index + 1}</span>
                          {option}
                          {correctOption && answered && <Check className="absolute right-3 top-3 size-4" aria-hidden="true" />}
                          {wrongSelected && <X className="absolute right-3 top-3 size-4" aria-hidden="true" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <form onSubmit={submitTypedAnswer} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
                    <label htmlFor="answer" className="sr-only">Your answer</label>
                    <Input ref={inputRef} id="answer" type="number" inputMode="numeric" min="0" value={typedAnswer} onChange={(event) => setTypedAnswer(event.target.value)} disabled={isCorrect !== null} aria-describedby={isCorrect !== null ? feedbackId : undefined} placeholder="Type your answer" className="h-14 rounded-xl border-2 bg-[#fffdf7] px-4 text-center text-xl font-black sm:text-left" />
                    <Button type="submit" disabled={!typedAnswer || isCorrect !== null} className="h-14 rounded-xl px-7 text-base font-extrabold">Check it</Button>
                  </form>
                )}

                <div className="mt-6 min-h-14 text-center" aria-live="polite" id={feedbackId}>
                  {isCorrect !== null && (
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                      <p className={`font-extrabold ${isCorrect ? 'text-[#23705f]' : 'text-[#a64034]'}`}>{isCorrect ? 'Yes — you nailed it!' : `Almost! The answer is ${question.answer}.`}</p>
                      <Button onClick={nextQuestion} variant="outline" className="h-10 rounded-xl border-2 px-4 font-extrabold">{questionNumber === ROUND_LENGTH ? 'See my score' : 'Next question'} <ArrowRight className="size-4" /></Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4 lg:pt-36" aria-label="Round stats">
          <div className="rounded-2xl border-2 border-foreground/10 bg-[#ffd166] p-5 shadow-[5px_5px_0_#e9ad32]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6d4310]">Round score</p>
            <p className="mt-2 text-4xl font-black tracking-[-0.05em] text-[#3f2d12]"><span className="tabular-nums">{score}</span><span className="text-xl text-[#805d24]"> / {ROUND_LENGTH}</span></p>
          </div>
          <div className="rounded-2xl border-2 border-foreground/10 bg-white/75 p-5 backdrop-blur">
            <div className="flex items-center justify-between"><p className="font-extrabold">Best streak</p><span className="rounded-lg bg-[#d9f3e9] px-3 py-1 font-black text-[#1d594e]">{bestStreak}</span></div>
            <div className="my-4 h-px bg-foreground/10" />
            <p className="flex items-start gap-2 text-sm leading-6 text-muted-foreground"><Keyboard className="mt-1 size-4 shrink-0" aria-hidden="true" /> Press 1–4 to answer in multiple choice, or type and press Enter in fill-in mode.</p>
          </div>
          <p className="px-2 text-center text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Facts from 2 × 2 to 12 × 12</p>
        </aside>
      </section>
    </main>
  );
}

