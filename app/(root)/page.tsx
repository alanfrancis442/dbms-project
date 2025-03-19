"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import { Database } from "lucide-react";

const Preloader = () => {
  const progressRef = useRef<HTMLDivElement>(null);
  const preloaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const progress = progressRef.current;
    const preloader = preloaderRef.current;

    let tl = gsap.timeline();

    tl.to(progress, {
      width: "100%",
      duration: 2,
      ease: "power2.inOut",
    });
    tl.to(preloader, {
      clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)",
      duration: 1,
      ease: "power2.inOut",
    });
  }, []);

  return (
    <div
      ref={preloaderRef}
      className="fixed inset-0 bg-[#121212] z-50 flex items-center justify-center"
      style={{
        clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
        transition: "clip-path 0.5s ease-in-out",
      }}
    >
      <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          ref={progressRef}
          className="h-full bg-gray-200 rounded-full"
          style={{ width: "0%" }}
        />
      </div>
    </div>
  );
};

const Page = () => {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="hero-container w-full h-screen relative bg-[#121212] font-[helvetica]">
      <Preloader />

      <div ref={contentRef} className="w-full h-full">
        <div className="navbar absolute top-0 w-full flex justify-between items-center px-[2%] py-6 z-10">
          <div className="logo">
            <Database className="h-6 w-6" />
          </div>

          <div className="nav-links flex items-center gap-8 ml-auto">
            <a
              href="#"
              className="text-gray-200 hover:text-gray-400 transition-colors font-[helvetica]"
            >
              Features
            </a>
            <a
              href="#"
              className="text-gray-200 hover:text-gray-400 transition-colors font-[helvetica]"
            >
              About
            </a>
            <Link href={"/connectdb"}>
              <button className="border border-gray-400 text-gray-200 px-6 py-2 bg-transparent hover:bg-white hover:text-black transition-all font-[helvetica]">
                Get Started
              </button>
            </Link>
          </div>
        </div>

        <iframe
          src="https://my.spline.design/robotfollowcursorforlandingpagemccopy-a59de008a50c06be1abec1889c345b3d/"
          className="w-full h-full border-none select-none"
        />

        <div className="text font-[helvetica] absolute bottom-0 left-0">
          <p className="text-left text-sm pl-[1.3%] md:w-[30rem] leading-none text-gray-300">
            DBForge is a powerful no-code database management tool that makes
            database work accessible to everyone. With an intuitive interface
            for creating tables, viewing structures, and running SQL queries, it
            features relationship visualization, smart auto-complete, and an
            integrated chatbot. Manage your databases effortlessly with our
            clean, user-friendly environment—no complex coding required.
          </p>
          <h1 className="text-gray-100 pl-2 text-[11vw] font-bold text-center leading-none">
            DATABASE FORGE
          </h1>
        </div>
      </div>
    </div>
  );
};

export default Page;
