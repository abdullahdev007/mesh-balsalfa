"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import styles from "./styles.module.scss";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaArrowRight } from "react-icons/fa";

const SLOGANS = [
  "كلنا نعرف السالفة… تقريبًا.",
  "برا السالفة؟ كأنك في حفلة ما حد عزمك لها.",
  "سالفة وحدة. مخ واحد مشبوك بالغلط.",
  "اعرفهم من سوالفهم… أو انكشف أول.",
  "اسأل بذكاء، كذب بثقة، عيش اللحظة.",
  "ذكاء، تورية، وكثير وجيه مستحية.",
  "إمّا تكشفهم… أو تنكشف!",
  "من برا الله الله… ومن جوّا ما يدري عن السالفة!",
  "كلهم يمثلون… بس من اللي قاعد يخبص؟",
  "برا السالفة يحاول ينجو، وانت تحاول تطيح فيه!",
  "سالفة وحدة، بس مليون طريقة تنفضح فيها.",
  "السالفة بسيطة… لو كنت تعرفها!",
  "البقاء للأذكى… أو للأكثر تمثيلًا.",
  "سالفة، شكوك، ووجه ما ينفهم!",
  "ما تدري مين معك… ومين برا اللعبة أصلًا!",
  "كل سؤال ممكن يوديك للقمة… أو يفضحك.",
  "مرحبًا بك في عالم الكذب الاجتماعي!",
  "برا السالفة؟ حظك اليوم يحدد مصيرك.",
  "في مش بلسالفة… الذكي ما يكشف نفسه.",
  "نكتشفك من نظراتك، لا تتوتر.",
];

const AboutPage = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const [currentSloganIndex, setCurrentSloganIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentSloganIndex((prevIndex) => (prevIndex + 1) % SLOGANS.length);
        setIsFading(false);
      }, 1000);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>مش بلسالفة</h1>
        <p className={`${styles.slogan} ${isFading ? styles.fade : ""}`}>
          {SLOGANS[currentSloganIndex]}
        </p>
        <button
          className={styles.backButton}
          onClick={() => router.push("/")}
          type="button"
        >
          <FaArrowRight size="1.2em" />
          <span className={styles.text}>رجوع</span>
        </button>
      </header>

      <main>
        <section className={styles.section}>
          <div className={styles.content}>
            <h2>هدف اللعبة</h2>
            <p>كشف من هو برا السالفة قبل أن يخدعكم... أو يخمنها قبلكم!</p>
            <p>
              اللعبة تعتمد على الذكاء، الملاحظة، والتلاعب بالكلام. كل اللاعبين
              يعرفون "السالفة" ما عدا شخص واحد، والمطلوب اكتشاف من هو هذا الشخص
              قبل أن يكتشف هو السالفة من خلال أسئلتكم!
            </p>
          </div>
          <div className={styles.image}>
            <Image
              src="/images/about/game-objective.webp"
              alt="هدف اللعبة"
              width={2048}
              height={2048}
              priority
            />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.content}>
            <h2>عدد اللاعبين</h2>
            <p>
              تتناسب اللعبة مع الجلسات العائلية، السهرات مع الأصدقاء، أو حتى
              اللعب عن بُعد.
            </p>
            <ul>
              <li>الحد الأدنى: 3 لاعبين</li>
              <li>الحد الأقصى: 12 لاعبًا</li>
            </ul>
          </div>
          <div className={styles.image}>
            <Image
              src="/images/about/player-count.webp"
              alt="عدد اللاعبين"
              width={2048}
              height={2048}
            />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.content}>
            <h2>أنماط اللعب</h2>
            <h3>وضع الأوفلاين (جهاز واحد):</h3>
            <br />
            <ul>
              <li>يُمرَّر الهاتف بين اللاعبين</li>
              <li>كل لاعب يرى السالفة أو يُقال له إنه "برا السالفة"</li>
            </ul>
            <h3>وضع الأونلاين (أجهزة متعددة):</h3>
            <br />
            <ul>
              <li>كل لاعب يدخل من جهازه</li>
              <li>لا حاجة لتمرير الجهاز</li>
              <li>ليس مثالي للعب عن بعد لكن مثالي للعب عند وجود عدد كبير</li>
            </ul>
          </div>
          <div className={styles.image}>
            <Image
              src="/images/about/game-modes.webp"
              alt="أنماط اللعب"
              width={2048}
              height={2048}
            />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.content}>
            <h2>طريقة اللعب</h2>
            <ul>
              <li>يدخل اللاعبون أسماءهم</li>
              <li>
                التطبيق يختار سالفة ويعرضها على الجميع ما عدا واحد: "برا
                السالفة"
              </li>
              <li>كل لاعب يسأل سؤالًا ذكيًا ليختبر الآخرين</li>
              <li>
                "برا السالفة" يجب أن يتصرف كأنه يعرف السالفة... بدون أن يُفضَح
              </li>
              <li>
                بعد انتهاء الأسئلة، يصوّت الجميع على من يعتقدون أنه "برا
                السالفة"
              </li>
              <li>"برا السالفة" يحاول تخمين السالفة</li>
            </ul>
          </div>
          <div className={styles.image}>
            <Image
              src="/images/about/gameplay.webp"
              alt="طريقة اللعب"
              width={2048}
              height={2048}
            />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.content}>
            <h2>قواعد اللعبة</h2>
            <ul>
              <li>لا يجوز كشف السالفة مباشرة</li>
              <li>الأسئلة يجب أن تكون ذكية وغير واضحة جدًا</li>
              <li>لا يُسمح للاعب بالإفصاح عن كونه "برا السالفة"</li>
              <li>
                في نهاية كل جولة، تُحتسب النقاط أو تُطبق العقوبات الترفيهية
              </li>
            </ul>
          </div>
          <div className={styles.image}>
            <Image
              src="/images/about/rules.webp"
              alt="قواعد اللعبة"
              width={2048}
              height={2048}
            />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.content}>
            <h2>ميزة تعديل السوالف</h2>
            <ul>
              <li>تعديل السوالف الجاهزة</li>
              <li>إضافة سوالف جديدة تناسب اهتمام المجموعة</li>
              <li>تخصيص الفئات (أكل، مشاهير، أنمي، إلخ)</li>
            </ul>
          </div>
          <div className={styles.image}>
            <Image
              src="/images/about/admin-features.webp"
              alt="ميزة تعديل السوالف"
              width={2048}
              height={2048}
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default AboutPage;
