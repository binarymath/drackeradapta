import React from 'react';

export const TradingCard = ({ data }) => {

    const {
        title = 'Nome do Card',
        hp = '100',
        outerBorderColor = '#374151',
        innerBorderColor = '#9ca3af',
        cardBgColor = '#e5e7eb',
        innerBgColor = '#ffffff',
        footerBgColor: footerColor = '#f3f4f6',
        titleColor = '#111827',
        textColor = '#1f2937',
        hpBgColor = '#ffffff',
        hpTextColor = '#dc2626',
        fontFamily = 'sans-serif',
        titleSize = 20,
        skillNameSize = 13,
        skillValSize = 14,
        skillDescSize = 10,
        footerDescSize = 10,
        titleAlign = 'left',
        skillDescAlign = 'left',
        footerDescAlign = 'center',
        imageUrl = '',
        skills = [],
        description = 'Descrição geral do card ou curiosidade.',
    } = data || {};

    let displaySkills = [...skills];
    if (displaySkills.length === 0 && (data?.skill1Name || data?.skill2Name)) {
        if (data.skill1Name || data.skill1Desc || data.skill1Val) {
            displaySkills.push({ name: data.skill1Name || '', desc: data.skill1Desc || '', val: data.skill1Val || '' });
        }
        if (data.skill2Name || data.skill2Desc || data.skill2Val) {
            displaySkills.push({ name: data.skill2Name || '', desc: data.skill2Desc || '', val: data.skill2Val || '' });
        }
    }

    const getDirectImageUrl = (url) => {
        if (!url) return '';
        const driveRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
        const match = url.match(driveRegex);
        if (match && match[1]) {
            return `https://lh3.googleusercontent.com/d/${match[1]}=w800`;
        }
        const driveRegex2 = /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/;
        const match2 = url.match(driveRegex2);
        if (match2 && match2[1]) {
            return `https://lh3.googleusercontent.com/d/${match2[1]}=w800`;
        }
        return url;
    };

    const finalImageUrl = getDirectImageUrl(imageUrl);

    return (
        <div className="w-[320px] h-[440px] rounded-2xl border-[8px] p-2 flex flex-col relative shadow-xl transform transition-transform hover:scale-105" style={{ backgroundColor: cardBgColor, borderColor: outerBorderColor }}>
            {/* Card Background Layer */}
            <div className="absolute inset-0 rounded-xl m-1 opacity-95 border-[6px]" style={{ backgroundColor: innerBgColor, borderColor: innerBorderColor, backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 100%)' }}></div>
            
            {/* Content Container */}
            <div className="relative z-10 flex flex-col h-full" style={{ color: textColor, fontFamily: fontFamily }}>
                {/* Header */}
                <div className="flex justify-between items-center mb-2 px-1 relative">
                    <h2 className="font-black tracking-tight uppercase flex-1" style={{ fontSize: `${titleSize}px`, color: titleColor, textShadow: '1px 1px 0px rgba(255,255,255,0.4)', lineHeight: 1.1, textAlign: titleAlign }}>{title}</h2>
                    <div className="flex items-center gap-1 font-bold drop-shadow-md px-2 rounded-full border shrink-0 ml-2" style={{ fontSize: `${titleSize * 0.8}px`, backgroundColor: hpBgColor, borderColor: innerBorderColor, color: hpTextColor }}>
                        <span className="opacity-80" style={{ color: textColor, fontSize: `${titleSize * 0.5}px` }}>HP</span> {hp}
                    </div>
                </div>

                {/* Image */}
                {!data?.hideImage && (
                    <div className="w-full h-40 bg-white border-4 rounded-sm shadow-inner mb-3 overflow-hidden flex items-center justify-center relative shrink-0" style={{ borderColor: innerBorderColor }}>
                        {finalImageUrl ? (
                            <img src={finalImageUrl} alt={title} className="w-full h-full object-fill" referrerPolicy="no-referrer" />
                        ) : (
                            <div className="text-gray-400 font-bold flex flex-col items-center">
                                <span>Sem Imagem</span>
                                <span className="text-xs font-normal">Use o gerador de IA</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Skills */}
                <div className="flex-1 flex flex-col gap-1 px-1 overflow-y-auto overflow-x-hidden justify-start my-1 custom-scrollbar">
                    {displaySkills.map((skill, index) => {
                        if (!skill.name && !skill.desc && !skill.val) return null;
                        return (
                            <div key={index} className="flex flex-col border-b border-black/10 pb-1 last:border-0" style={{ borderColor: innerBorderColor }}>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold flex items-center gap-1.5 leading-tight" style={{ fontSize: `${skillNameSize}px` }}>
                                        <div className="w-2.5 h-2.5 rounded-full shadow-sm border border-white flex-shrink-0" style={{ backgroundColor: outerBorderColor }}></div>
                                        {skill.name}
                                    </span>
                                    <span className="font-bold ml-1" style={{ fontSize: `${skillValSize}px` }}>{skill.val}</span>
                                </div>
                                {skill.desc && (
                                    <span className="leading-tight opacity-90 italic mt-1 mb-1 block whitespace-pre-wrap px-1" style={{ color: textColor, fontSize: `${skillDescSize}px`, textAlign: skillDescAlign }}>{skill.desc}</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Flavor Text / Footer */}
                <div className="mt-auto border-t py-2 px-2 rounded italic leading-tight min-h-[40px] flex items-center shadow-inner shrink-0" style={{ backgroundColor: footerColor, borderColor: innerBorderColor, color: textColor, fontSize: `${footerDescSize}px` }}>
                    <div className="w-full whitespace-pre-wrap" style={{ textAlign: footerDescAlign }}>{description}</div>
                </div>
            </div>
        </div>
    );
};

