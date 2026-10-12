import React from 'react';
import { toDirectImageUrl, handleDriveImageError } from '../../utils/urlUtils';

export const TradingCard = ({ data, noHoverScale = false, isPrint = false }) => {

    const {
        title = 'Nome do Card',
        hp = '100',
        hideHp = false,
        hpSize = 16,
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
        imageHeight = 160,
        imageFit = 'cover',
        imageMarginTop = 0,
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

    const getDirectImageUrl = toDirectImageUrl;
    const finalImageUrl = getDirectImageUrl(imageUrl);

    return (
        <div 
            className={`w-[320px] h-[440px] rounded-2xl border-[8px] p-2 flex flex-col relative box-border ${
                isPrint ? 'shadow-none' : (noHoverScale ? 'shadow-xl' : 'shadow-xl transform transition-transform hover:scale-105')
            } print:shadow-none print:transform-none select-none`} 
            style={{ backgroundColor: cardBgColor, borderColor: outerBorderColor }}
        >
            {/* Card Background Layer */}
            <div className="absolute inset-0 rounded-xl m-1 opacity-95 border-[6px]" style={{ backgroundColor: innerBgColor, borderColor: innerBorderColor, backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 100%)' }}></div>
            
            {/* Content Container */}
            <div className="relative z-10 flex flex-col h-full px-1 pt-1.5 pb-1 box-border justify-between" style={{ color: textColor, fontFamily: fontFamily }}>
                {/* Header */}
                <div className="flex justify-between items-center mb-1 px-1 relative min-h-[30px] shrink-0">
                    <h2 
                        className="font-black tracking-tight uppercase flex-1" 
                        style={{ 
                            fontSize: `${titleSize}px`, 
                            color: titleColor, 
                            textShadow: '1px 1px 0px rgba(255,255,255,0.4)', 
                            lineHeight: 1.22, 
                            textAlign: titleAlign,
                            paddingTop: '2px',
                            paddingBottom: '1px'
                        }}
                    >
                        {title}
                    </h2>
                    {!hideHp && (
                        <div className="flex items-center gap-1 font-bold drop-shadow-md px-2 py-0.5 rounded-full border shrink-0 ml-2" style={{ fontSize: `${hpSize || 16}px`, backgroundColor: hpBgColor, borderColor: innerBorderColor, color: hpTextColor }}>
                            <span className="opacity-80" style={{ color: textColor, fontSize: `${Math.max(8, Math.round((hpSize || 16) * 0.55))}px` }}>HP</span> {hp}
                        </div>
                    )}
                </div>

                {/* Image */}
                {!data?.hideImage && (
                    <div 
                        className="w-full bg-white border-4 rounded-sm shadow-inner mb-1.5 overflow-hidden flex items-center justify-center relative shrink-0 transition-all duration-150" 
                        style={{ 
                            height: `${imageHeight || 160}px`, 
                            borderColor: innerBorderColor,
                            marginTop: imageMarginTop ? `${imageMarginTop}px` : undefined 
                        }}
                    >
                        {finalImageUrl ? (
                            <img 
                                src={finalImageUrl} 
                                alt={title} 
                                crossOrigin="anonymous"
                                className={`w-full h-full ${
                                    imageFit === 'contain' ? 'object-contain bg-slate-900/5' :
                                    imageFit === 'fill' ? 'object-fill' :
                                    'object-cover'
                                }`} 
                                referrerPolicy="no-referrer" 
                                onError={handleDriveImageError} 
                            />
                        ) : (
                            <div className="text-gray-400 font-bold flex flex-col items-center">
                                <span>Sem Imagem</span>
                                <span className="text-xs font-normal">Use o gerador de IA</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Skills */}
                <div className={`flex-1 flex flex-col gap-1 px-1 justify-start my-1 ${isPrint ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden custom-scrollbar'}`}>
                    {displaySkills.map((skill, index) => {
                        if (!skill.name && !skill.desc && !skill.val) return null;
                        return (
                            <div key={index} className="flex flex-col border-b border-black/10 pb-0.5 last:border-0" style={{ borderColor: innerBorderColor }}>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold flex items-center leading-tight" style={{ fontSize: `${skillNameSize}px` }}>
                                        {skill.name}
                                    </span>
                                    <span className="font-bold ml-1 shrink-0" style={{ fontSize: `${skillValSize}px` }}>{skill.val}</span>
                                </div>
                                {skill.desc && (
                                    <span className="leading-snug opacity-90 italic mt-0.5 mb-0.5 block whitespace-pre-wrap px-0.5" style={{ color: textColor, fontSize: `${skillDescSize}px`, textAlign: skillDescAlign }}>{skill.desc}</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Flavor Text / Footer */}
                <div className="mt-auto border-t py-1.5 px-2 rounded italic leading-normal min-h-[38px] flex items-center shadow-inner shrink-0" style={{ backgroundColor: footerColor, borderColor: innerBorderColor, color: textColor, fontSize: `${footerDescSize}px` }}>
                    <div className="w-full whitespace-pre-wrap" style={{ textAlign: footerDescAlign }}>{description}</div>
                </div>
            </div>
        </div>
    );
};

