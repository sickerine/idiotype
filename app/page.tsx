"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Lock } from "lucide-react";
import { socket } from "@/socket/socket"

export default function Home() {
  const sentence = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Vero ad rem ea voluptatibus excepturi blanditiis laborum necessitatibus ipsum animi quaerat placeat fuga sapiente maiores natus, culpa commodi itaque provident suscipit?"
  const words = sentence.split(" ");
  const [focused, setFocused] = useState(true);
  const [typedText, setTypedText] = useState("");
  const [capsLock, setCapsLock] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onConnect() {
      console.log("connected");
    }

    function onDisconnect() {
      console.log("disconnected");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("new-text", (text: string) => {
      console.log("new text", text);
    })

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    }
  }, [])


  useEffect(() => {
    const updateCursor = () => {
      if (cursorRef.current) {
        const span = document.getElementById(String(typedText.length));
        const previousSpan = document.getElementById(String(typedText.length - 1));
        console.log("found span", span)
        if (span) {
          cursorRef.current.style.left = span.offsetLeft + "px";
          cursorRef.current.style.top = span.offsetTop + span.offsetHeight / 2 + "px";
          cursorRef.current.style.opacity = "1";
        } else if (previousSpan) {
          cursorRef.current.style.left = previousSpan.offsetLeft + previousSpan.offsetWidth + "px";
          cursorRef.current.style.top = previousSpan.offsetTop + previousSpan.offsetHeight / 2 + "px";
          cursorRef.current.style.opacity = "1";

        }
      }
    }


    const listener = (e: KeyboardEvent) => {
      if (!focused) return;

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
        setTypedText((prev) => prev + e.key);
      }

      socket.emit("typing", e.key)

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

  return (
    <main className="flex justify-center items-center h-screen w-screen bg-sky-950/50 flex-col gap-4">
      <div className="flex flex-col gap-4">
        <div className="flex w-full items-end gap-2">
          <div className="text-[3rem] leading-[3rem] font-black">
            0
          </div>
          <div className="text-sm">
            WPM
          </div>
          <div className="text-sm ml-auto">
            Accuracy
          </div>
          <div className="text-[3rem] leading-[3rem] font-black">
            100
          </div>
          <div>
            %
          </div>
        </div>
        <div className={"w-full max-w-[1280px] bg-sky-950 rounded-3xl overflow-hidden relative"}>
          <div className={twMerge("absolute  inset-0 flex justify-center items-center font-medium text-xl opacity-100 transition-all", focused && "opacity-0 -translate-x-24")}>
            Focus to start typing.
          </div>
          <div className={twMerge("blur-lg relative transition-all", focused && "blur-none")}>
            <input ref={inputRef} autoFocus onBlur={(e) => setFocused(false)} onFocus={(e) => setFocused(true)} className="absolute w-full h-full inset-0 z-10 opacity-0" />
            <div className="flex flex-wrap content-start text-xl gap-2 p-6 relative">
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
        setTypedText("");
        inputRef.current?.focus();
      }}>
        Retry
      </button>
    </main>
  );
}
