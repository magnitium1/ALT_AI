import React, { useState, useEffect } from 'react';
import './TeamAnimation.css';

const TeamAnimation = () => {
  const [showVasily, setShowVasily] = useState(false);
  const [showPlus1, setShowPlus1] = useState(false);
  const [showRoman, setShowRoman] = useState(false);
  const [showPlus2, setShowPlus2] = useState(false);
  const [showLera, setShowLera] = useState(false);
  const [showArrow, setShowArrow] = useState(false);
  const [showBestTeam, setShowBestTeam] = useState(false);

  useEffect(() => {
    // Последовательная анимация
    const timer1 = setTimeout(() => setShowVasily(true), 500);
    const timer2 = setTimeout(() => setShowPlus1(true), 1500);
    const timer3 = setTimeout(() => setShowRoman(true), 2000);
    const timer4 = setTimeout(() => setShowPlus2(true), 3000);
    const timer5 = setTimeout(() => setShowLera(true), 3500);
    const timer6 = setTimeout(() => setShowArrow(true), 4500);
    const timer7 = setTimeout(() => setShowBestTeam(true), 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timer6);
      clearTimeout(timer7);
    };
  }, []);

  return (
    <div className="team-animation-container">
      <div className="animation-wrapper">
        {/* Василий */}
        <div className={`name-block ${showVasily ? 'show' : ''}`}>
          <span>Василий</span>
        </div>

        {/* Первый плюсик */}
        <div className={`plus-sign ${showPlus1 ? 'show' : ''}`}>
          <span>+</span>
        </div>

        {/* Роман */}
        <div className={`name-block ${showRoman ? 'show' : ''}`}>
          <span>Роман</span>
        </div>

        {/* Второй плюсик */}
        <div className={`plus-sign ${showPlus2 ? 'show' : ''}`}>
          <span>+</span>
        </div>

        {/* Лера */}
        <div className={`name-block ${showLera ? 'show' : ''}`}>
          <span>Лера</span>
        </div>

        {/* Стрелочка вниз */}
        <div className={`arrow-down ${showArrow ? 'show' : ''}`}>
          <span>↓</span>
        </div>

        {/* Лучшая команда */}
        <div className={`name-block best-team ${showBestTeam ? 'show' : ''}`}>
          <span>Лучшая команда</span>
        </div>
      </div>
    </div>
  );
};

export default TeamAnimation;
