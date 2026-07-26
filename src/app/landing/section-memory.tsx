import { CANDY } from "./content";
import { DiagramMemory } from "./diagram-memory";
import { Lead, Section } from "./section-shell";

export function SectionMemory() {
  return (
    <Section
      id="l04"
      code="L04"
      eyebrow="它會記得你"
      color={CANDY.purple}
      title="學過的東西會忘，樹會提醒你回來"
    >
      <Lead>
        通過檢核的節點會亮燈，但印象會隨時間變淡。太久沒碰的節點會在技能樹上裂開，跟你以前答錯的地方一起排進今天的複習清單——複習出的題目會刻意打向你那時候想錯的點，通過了才重新亮燈。
      </Lead>

      <div className="mt-8 overflow-x-auto rounded-3xl border-2 border-[#E5E5E5] bg-white p-5 sm:p-7">
        <DiagramMemory />
      </div>

      <p className="mt-6 max-w-3xl text-sm leading-relaxed font-medium text-[#17242D]/65">
        記下來的不是分數，是「你當時哪裡想錯了」——這是它跟一般線上課程最不一樣的地方。
      </p>
    </Section>
  );
}
