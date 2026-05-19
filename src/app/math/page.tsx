"use client";

import { useEffect, useState } from "react";
import { BackBar } from "@/components/BackBar";
import { Brain, Check, X, RefreshCw } from "lucide-react";

type Op = "+" | "-" | "×" | "÷";
type Problem = { a: number; b: number; op: Op; answer: number };

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeProblem(age: string): Problem {
  if (age === "4-6") {
    const op: Op = Math.random() < 0.5 ? "+" : "-";
    const a = rand(1, 10);
    const b = rand(1, Math.min(a, 10));
    return op === "+"
      ? { a, b, op, answer: a + b }
      : { a, b, op, answer: a - b };
  }
  if (age === "6-8") {
    const op: Op = Math.random() < 0.5 ? "+" : "-";
    const a = rand(5, 30);
    const b = rand(1, op === "-" ? a : 25);
    return op === "+"
      ? { a, b, op, answer: a + b }
      : { a, b, op, answer: a - b };
  }
  if (age === "8-10") {
    const ops: Op[] = ["+", "-", "×"];
    const op = ops[rand(0, 2)];
    if (op === "×") {
      const a = rand(2, 9);
      const b = rand(2, 9);
      return { a, b, op, answer: a * b };
    }
    const a = rand(20, 100);
    const b = rand(1, op === "-" ? a : 80);
    return op === "+"
      ? { a, b, op, answer: a + b }
      : { a, b, op, answer: a - b };
  }
  // 10+
  const ops: Op[] = ["+", "-", "×", "÷"];
  const op = ops[rand(0, 3)];
  if (op === "÷") {
    const b = rand(2, 12);
    const answer = rand(2, 12);
    return { a: b * answer, b, op, answer };
  }
  if (op === "×") {
    const a = rand(3, 15);
    const b = rand(3, 15);
    return { a, b, op, answer: a * b };
  }
  const a = rand(50, 500);
  const b = rand(1, op === "-" ? a : 400);
  return op === "+"
    ? { a, b, op, answer: a + b }
    : { a, b, op, answer: a - b };
}

export default function MathPage() {
  const [ageRange, setAgeRange] = useState("6-8");
  const [problem, setProblem] = useState<Problem>(makeProblem("6-8"));
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"none" | "right" | "wrong">("none");
  const [score, setScore] = useState({ right: 0, total: 0 });

  useEffect(() => {
    setProblem(makeProblem(ageRange));
    setInput("");
    setFeedback("none");
  }, [ageRange]);

  function check() {
    if (input.trim() === "") return;
    const v = Number(input);
    const right = v === problem.answer;
    setFeedback(right ? "right" : "wrong");
    setScore((s) => ({
      right: s.right + (right ? 1 : 0),
      total: s.total + 1,
    }));
    setTimeout(() => {
      setProblem(makeProblem(ageRange));
      setInput("");
      setFeedback("none");
    }, 900);
  }

  return (
    <main className="min-h-screen">
      <BackBar title="Math Practice" />

      <section className="mx-auto max-w-3xl px-6 md:px-10 pb-16">
        <div className="bg-soft-card rounded-xl2 shadow-tile p-6 md:p-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 grid place-items-center rounded-2xl bg-accent-purple text-white">
                <Brain size={20} />
              </span>
              <select
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                className="rounded-xl border border-primary-100 bg-soft-bg px-3 py-2 text-sm font-bold"
              >
                <option value="4-6">Ages 4–6</option>
                <option value="6-8">Ages 6–8</option>
                <option value="8-10">Ages 8–10</option>
                <option value="10+">Ages 10+</option>
              </select>
            </div>
            <div className="text-sm font-bold text-soft-muted">
              Score: <span className="text-ink">{score.right}</span> / {score.total}
            </div>
          </div>

          <div className="text-center py-10">
            <div className="font-display font-extrabold text-6xl md:text-7xl text-ink tracking-tight">
              {problem.a} {problem.op} {problem.b} = ?
            </div>

            <div className="mt-8 flex items-center justify-center gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value.replace(/[^\-\d]/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && check()}
                inputMode="numeric"
                placeholder="?"
                className="w-32 text-center text-3xl font-extrabold rounded-2xl border-2 border-primary-100 bg-soft-bg py-3 focus:border-primary-500 outline-none"
              />
              <button
                onClick={check}
                className="px-6 py-3.5 rounded-2xl bg-accent-purple text-white font-bold shadow-soft hover:opacity-90"
              >
                Check
              </button>
              <button
                onClick={() => setProblem(makeProblem(ageRange))}
                className="px-3.5 py-3.5 rounded-2xl bg-soft-bg text-soft-muted font-bold hover:bg-primary-50"
                aria-label="New problem"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="h-8 mt-5">
              {feedback === "right" && (
                <p className="inline-flex items-center gap-2 text-accent-green font-bold">
                  <Check size={18} /> That&apos;s right!
                </p>
              )}
              {feedback === "wrong" && (
                <p className="inline-flex items-center gap-2 text-accent-pink font-bold">
                  <X size={18} /> Try again — answer was {problem.answer}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
