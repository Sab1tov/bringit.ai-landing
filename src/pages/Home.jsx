import React from "react";
import { Nav } from "../components/organisms/Nav";
import { Hero } from "../components/organisms/Hero";
import { ProblemSection } from "../components/organisms/ProblemSection";
import { ProductSwitch } from "../components/organisms/ProductSwitch";
import { UseCases } from "../components/organisms/UseCases";
import { Implementation } from "../components/organisms/Implementation";
import { FooterCTA } from "../components/organisms/FooterCTA";

export const Home = () => (
  <>
    <Nav />
    <Hero />
    <div className="border-t border-slate-100">
      <ProblemSection />
    </div>
    <div className="border-t border-slate-100">
      <ProductSwitch />
    </div>
    <div className="border-t border-slate-100">
      <UseCases />
    </div>
    <div className="border-t border-slate-100">
      <Implementation />
    </div>
    <FooterCTA />
  </>
);
