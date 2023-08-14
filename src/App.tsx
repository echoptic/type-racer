import type { Component } from "solid-js";
import { Suspense, createSignal } from "solid-js";
import { Show } from "solid-js";
import { Switch } from "solid-js";
import { Match } from "solid-js";
import { For } from "solid-js";
import { createEffect } from "solid-js";
import { createResource } from "solid-js";

const fetchQuote = async (category: string) => {
  const data = await (
    await fetch(`https://api.api-ninjas.com/v1/quotes?category=${category}`, {
      headers: {
        "X-Api-Key": import.meta.env.VITE_API_NINJAS_KEY,
      },
    })
  ).json();
  return data[0].quote.split(" ");
};

const App: Component = () => {
  let input: HTMLInputElement;
  const [quote, { refetch }] = createResource("", fetchQuote);
  const [numCleared, setNumCleared] = createSignal(0);
  const [text, setText] = createSignal("");
  const currentWord = () => quote()[numCleared()];

  const [start, setStart] = createSignal(false);
  const [gameOver, setGameOver] = createSignal(false);
  const [countdown, setCountdown] = createSignal(5);

  const [startTime, setStartTime] = createSignal(0);
  const [endTime, setEndTime] = createSignal(0);
  const wpm = () =>
    Math.round((quote().length / ((endTime() - startTime()) / 1000)) * 60);

  const [intervalId, setIntervalId] = createSignal(null);

  createEffect(() => {
    if (
      text().split(" ")[0] === currentWord() &&
      (text().endsWith(" ") || numCleared() === quote().length - 1)
    ) {
      setNumCleared((n) => n + 1);
      setText("");
    }

    if (countdown() === 0) {
      input.disabled = false;
      input.placeholder = "";
      input.focus();
      setStartTime(Date.now());
    }

    if (numCleared() === quote().length) {
      setEndTime(Date.now());
      setGameOver(true);
      setNumCleared((n) => n + 1);
    }
  });

  const startGame = () => {
    setStart(true);
    setIntervalId(
      setInterval(() => {
        setCountdown((n) => n - 1);
      }, 1000)
    );
  };

  const restart = () => {
    setStart(false);
    setGameOver(false);
    clearInterval(intervalId());
    setCountdown(5);
    setNumCleared(0);
    refetch();
  };

  return (
    <div class="flex justify-center items-center h-screen flex-col">
      <div>
        <Show when={start() && countdown() > -2}>
          <Switch fallback={<span>Go!</span>}>
            <Match when={countdown() >= 4}>
              <span>It's the final countdown!</span>
            </Match>
            <Match when={countdown() < 4 && countdown() > 0}>
              <span>Get ready to race!</span>
            </Match>
          </Switch>
          <Show when={countdown() > 0}>
            {" :"}
            {countdown()}
          </Show>
        </Show>
      </div>
      <div class="border-2 rounded-lg border-blue-100 p-5 bg-blue-50">
        <Switch
          fallback={
            <button onClick={() => startGame()}>Enter a Typing Race</button>
          }
        >
          <Match when={gameOver()}>
            <p>Words per minute: {wpm()}</p>
            <button onClick={() => restart()}>Click here to restart</button>
          </Match>
          <Match when={start()}>
            <div class="text-center text-lg">
              <Suspense fallback={<p>Loading...</p>}>
                <For each={quote()}>
                  {(word, i) => (
                    <>
                      <Show
                        when={i() === numCleared()}
                        fallback={
                          <span
                            classList={{
                              "text-yellow-500": i() < numCleared(),
                            }}
                          >
                            {word}
                          </span>
                        }
                      >
                        <For each={word.split("")}>
                          {(letter, j) => (
                            <span class="underline">
                              <span
                                classList={{
                                  "text-yellow-500": text()[j()] === letter,
                                  "bg-red-300":
                                    text()[j()] && text()[j()] !== letter,
                                }}
                              >
                                {letter}
                              </span>
                            </span>
                          )}
                        </For>
                      </Show>{" "}
                    </>
                  )}
                </For>
              </Suspense>
            </div>
            <input
              class="border w-full mt-5"
              ref={input}
              value={text()}
              onInput={(e) => setText(e.target.value)}
              type="text"
              placeholder="Type the above text here when the race begins"
              disabled
            />
          </Match>
        </Switch>
      </div>
    </div>
  );
};

export default App;
