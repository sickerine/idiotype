"use client";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Lock } from "lucide-react";
// import { socket } from "@/socket/socket"

const paragraph = `ARTICLE 9 – INTELLECTUAL PROPERTY
The name « 42 », the logos, mottos, domain names and any other distinctive sign of 42, represented on the Intranet 42 or used/exploited by 42, are the exclusive property of 42.

Any use, replication and/or modification that would be done without the prior written consent of 42 might constitute an act of counterfeit, in accordance with the Intellectual Property Code and engage the civil and/or criminal liability of the counterfeiter, notwithstanding the right to damages and interests that 42 could claim.

The presentation and the content of the Intranet 42 constitute a work protected by the applicable laws on intellectual property and are the property of 42. No replication and/or representation, whether partial or integral, shall be made without the prior written consent of 42.

The drawings, photographs, images, texts, animated footages, with or without sound, databases, software as well as the pedagogical videos and media, the computer code of the Intranet 42 and other documentations represented on the Intranet 42 are eligible for the protection conferred by the Intellectual Property Code or by the image rights and are, as the case may be, the property of 42 or of third-parties having authorized 42 to exploit them.

As such, any replication, representation, adaptation, translation and/or modification, whether partial or total, or transfer to another website are strictly prohibited, without the prior written consent of 42.

The same applies to the extraction and reuse of the content of the databases accessible from the Intranet 42 which are protected by the provisions of the law of July 1st, 1998 on the transposition in the Intellectual Property Code of the European Directive of March 11th, 1996 on the legal protection of databases.

As such, any replication, reuse or extraction of the content of the database would engage the liability of the User, notwithstanding the right to damages and interests that 42 could claim.`

  function generateSentence(): [string, string[]] {
    const amountOfWords = 10;
    const words = paragraph.split(/[^a-zA-Z]/g).map((word) => word.toLowerCase()).filter((word) => word.length > 0).filter((word, index, self) => self.indexOf(word) === index)

    let newWords = [];
    for (let i = 0; i < amountOfWords; i++) {
      newWords.push(words[Math.floor(Math.random() * words.length)]);
    }
    return [newWords.join(" "), newWords];
  }

  function useWords(): [string, string[], () => void] {
    const [[sentence, words], setRandomized] = useState<[string, string[]]>(["", []]);

    const randomizeWords = useCallback(() => {
      const [sentence, words] = generateSentence();
      setRandomized([sentence, words]);
    }, [])

    useEffect(() => {
      if (words.length === 0)
        randomizeWords();
    }, [])

    return [sentence, words, randomizeWords];
  }

  function setWPMText(WPM: number) {
    const div = document.getElementById("wpm");
    if (div)
      div.innerText = String(WPM);
  }


export default function Home() {
  const [sentence, words, randomizeWords] = useWords();
  const [focused, setFocused] = useState(true);
  const [typedText, setTypedText] = useState("");
  const [capsLock, setCapsLock] = useState(false);
  const [timeStarted, setTimeStarted] = useState(0);
  const [timer, setTimer] = useState(10);
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  const isFinished = useCallback(() => typedText.length >= sentence.length || timer == 0, [typedText, sentence]);
  const updateCursor = useCallback(() => {
    if (cursorRef.current) {
      const span = document.getElementById(String(typedText.length));
      const previousSpan = document.getElementById(String(typedText.length - 1));
      console.log("found span", span)
      if (span) {
        cursorRef.current.style.left = span.offsetLeft + "px";
        cursorRef.current.style.top = span.offsetTop + span.offsetHeight / 2 + "px";
      } else if (previousSpan) {
        cursorRef.current.style.left = previousSpan.offsetLeft + previousSpan.offsetWidth + "px";
        cursorRef.current.style.top = previousSpan.offsetTop + previousSpan.offsetHeight / 2 + "px";
      }
      cursorRef.current.style.opacity = isFinished() ? "0" : "1";
    }
  }, [typedText])

  // useEffect(() => {
  //   function onConnect() {
  //     console.log("connected");
  //   }

  //   function onDisconnect() {
  //     console.log("disconnected");
  //   }

  //   socket.on("connect", onConnect);
  //   socket.on("disconnect", onDisconnect);
  //   socket.on("new-text", (text: string) => {
  //     console.log("new text", text);
  //   })

  //   return () => {
  //     socket.off("connect", onConnect);
  //     socket.off("disconnect", onDisconnect);
  //   }
  // }, [])

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (!focused || timer == 0) return;

      const alphabetKeys = "abcdefghijklmnopqrstuvwxyz";
      const capitalAlphabetKeys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const punctuationKeys = ".,?!;:'\"(){}[]";
      const spaceKey = " ";

      console.log(e.key); 

      if (e.key === "Backspace") {
        setTypedText((prev) => {
          const newText = prev.slice(0, prev.length - 1);
          console.log("current text", prev);
          console.log("new text", newText);
          return newText;
        })
      } else if ((alphabetKeys
        + capitalAlphabetKeys
        + punctuationKeys
        + spaceKey).includes(e.key)) {
        if (timeStarted == 0)
          setTimeStarted(Date.now());
        setTypedText((prev) => prev + e.key);
      }

      // socket.emit("typing", e.key)

      updateCursor();
    }

    const capsLockListener = (e: KeyboardEvent) => {
      setCapsLock(e.getModifierState("CapsLock"));
    }

    window.addEventListener("keydown", listener);
    window.addEventListener("keydown", capsLockListener);
    window.addEventListener("keyup", capsLockListener);
    updateCursor();
    return () => {
      window.removeEventListener("keydown", listener);
      window.removeEventListener("keydown", capsLockListener);
      window.removeEventListener("keyup", capsLockListener);
    }
  }, [focused, typedText])

  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;
    let wpmInterval: NodeJS.Timeout | null = null;

    if (timeStarted > 0) {
      timerInterval = setInterval(() => {
        setTimer((prev) => {
          if ((prev === 1 || typedText.length >= words.length) && timerInterval) {
            clearInterval(timerInterval);
            return 0;
          }
          return prev - 1;
        })
      }, 1000)

      wpmInterval = setInterval(() => {
        const timeElapsed = (Date.now() - timeStarted) / 1000;
        const correctCharacters = typedText.split("").filter((char, index) => char === sentence.split("")[index]).length;
        const WPM = Math.round(correctCharacters / 5 / (timeElapsed / 60));
        if (!isFinished())
          setWPMText(WPM);
      }, 100)
    }

    return () => {
      if (timerInterval)
        clearInterval(timerInterval);
      
      if (wpmInterval)
        clearInterval(wpmInterval);
    }
  }, [timeStarted, typedText])


  return (
    <main className="flex justify-center items-center h-screen w-screen bg-sky-950/50 flex-col gap-4">
      <div className="w-full max-w-[1280px] flex flex-col gap-4">
        <div className="flex w-full items-end gap-2">
          <div className="flex-1 flex gap-2 items-end">
            <div suppressHydrationWarning id={"wpm"} className="text-[3rem] leading-[3rem] font-black">
              0
            </div>
            <div className="text-sm">
              WPM
            </div>
          </div>
          <div className="flex-1 text-white flex justify-center items-center">
            <div className="bg-sky-900 w-48 justify-center py-4 rounded-xl flex items-end gap-1">
              <div className="text-[3rem] leading-[3rem] font-black">
                {timer}
              </div>
              <div>
                s
              </div>
            </div>
          </div>
          <div className="flex-1 flex gap-2 items-end justify-end">

            <div className="text-sm">
              Accuracy
            </div>
            <div className="text-[3rem] leading-[3rem] font-black">
              100
            </div>
            <div>
              %
            </div>
          </div>
        </div>
        <div className={"w-full bg-sky-950 rounded-3xl overflow-hidden relative"}>
          <div className={twMerge("absolute  inset-0 flex justify-center items-center font-medium text-xl opacity-100 transition-all", focused && "opacity-0 -translate-x-24")}>
            Focus to start typing.
          </div>
          <div className={twMerge("blur-lg relative transition-all h-full", focused && "blur-none")}>
            <input ref={inputRef} autoFocus onBlur={(e) => setFocused(false)} onFocus={(e) => setFocused(true)} className="absolute w-full h-full inset-0 z-10 opacity-0" />
            <div className="flex flex-wrap content-start text-xl gap-2 p-6 relative transition-all min-h-[144px]">
              <div ref={cursorRef} className="absolute w-[1px] h-6 bg-white opacity-0 transition-all delay-0 -translate-y-1/2" />
              {
                words.map((word, wordIndex) => {
                  const letters = word.split("");
                  return (
                    <div key={wordIndex} className="flex bg-white/10 p-2 rounded-lg">
                      {
                        letters.map((letter, letterIndex) => {
                          const actualIndex = words.slice(0, wordIndex).join(" ").length + (wordIndex > 0 ? 1 : 0) + letterIndex
                          return (
                            <span id={String(actualIndex)} key={letterIndex} className={twMerge("text-white",
                              typedText.length - 1 < actualIndex && "text-opacity-50",
                              (typedText.length > actualIndex && typedText[actualIndex] !== letter) && "text-red-500",
                            )}>{letter}</span>
                          )
                        })
                      }
                    </div>
                  )
                })
              }
            </div>
            <div className={twMerge("w-full h-0 bg-sky-600 transition-all flex justify-center items-center overflow-hidden text-xs gap-1", capsLock && "h-6")} >
              <Lock size={12} />
              Caps Lock
            </div>
          </div>
        </div>
      </div>
      <button className="px-4 py-2 rounded-xl active:bg-white/10 active:scale-95 transition-all focus:bg-white/10 focus:outline-none" onClick={() => {
        randomizeWords();
        setTimeStarted(0);
        setTimer(10);
        setTypedText("");
        setWPMText(0);
        inputRef.current?.focus();
      }}>
        Retry
      </button>
    </main>
  );
}
