import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Check,
  RotateCcw,
  Layers,
  Bot,
  TrendingUp,
  Activity,
  ArrowRight
} from 'lucide-react';
import { SwipeableModalSheet } from './SwipeableModalSheet';
import { triggerHaptic } from '../utils/haptics';
import { subscriptionService } from '../services/subscriptionService';
import { currencyService } from '../services/currencyService';
import type { SubscriptionPlan, PaywallTriggerReason } from '../types/subscription';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: PaywallTriggerReason;
  onSuccess?: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  reason = 'general',
  onSuccess
}) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('annual');
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [plans, setPlans] = useState(() => currencyService.getLocalizedPlans());
  const [currencyConfig, setCurrencyConfig] = useState(() => currencyService.getCurrencyConfig());

  useEffect(() => {
    const unsub = currencyService.subscribe(() => {
      setPlans(currencyService.getLocalizedPlans());
      setCurrencyConfig(currencyService.getCurrencyConfig());
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    triggerHaptic('light');
    setSelectedPlan(plan);
  };

  const handleSubscribe = () => {
    triggerHaptic('success');
    subscriptionService.upgradeToPro(selectedPlan);
    if (onSuccess) onSuccess();
    onClose();
  };

  const handleRestore = async () => {
    triggerHaptic('medium');
    setRestoring(true);
    setRestoreMessage(null);
    try {
      const res = await subscriptionService.restorePurchases();
      setRestoreMessage(res.message);
      if (res.isPro) {
        triggerHaptic('success');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1200);
      }
    } catch (e: any) {
      setRestoreMessage(e.message || 'Failed to restore purchases.');
    } finally {
      setRestoring(false);
    }
  };

  const handleToggleDevMode = () => {
    triggerHaptic('medium');
    const updated = subscriptionService.toggleDevPro();
    setRestoreMessage(
      updated.isPro
        ? 'Dev Mode: Pro membership enabled!'
        : 'Dev Mode: Reverted to Free tier.'
    );
    if (updated.isPro) {
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 800);
    }
  };

  // Dynamic context header
  const getHeaderInfo = () => {
    switch (reason) {
      case 'routine_limit':
        return {
          tag: 'ROUTINE LIMIT REACHED',
          title: 'Unlock Unlimited Routines',
          subtitle: 'The Free tier includes 3 active routines. Upgrade to Overload Pro for unlimited custom routines and splits.'
        };
      case 'ai_coach':
        return {
          tag: 'AI COACH QUOTA',
          title: 'Unlock Your 24/7 AI Coach',
          subtitle: 'Get unlimited hyper-personalized hypertrophy programming, biomechanical cues, and fatigue autoregulation.'
        };
      case 'smart_swap':
        return {
          tag: 'SMART SWAPS',
          title: 'Instant Equipment Smart Swaps',
          subtitle: 'Never wait for occupied gym equipment again. Swap exercises with identical hypertrophy recruitment.'
        };
      default:
        return {
          tag: 'OVERLOAD PRO ATHLETE',
          title: 'Elevate Your Hypertrophy',
          subtitle: 'Unlock the complete progressive overload operating system designed for serious lifters.'
        };
    }
  };

  const header = getHeaderInfo();

  return (
    <SwipeableModalSheet onClose={onClose} maxHeight="92vh">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Header with Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(0, 245, 155, 0.12)',
                border: '1px solid rgba(0, 245, 155, 0.3)',
                borderRadius: 'var(--radius-full)',
                padding: '3px 10px',
                fontSize: '0.68rem',
                fontWeight: 800,
                color: 'var(--accent-volt)',
                letterSpacing: '0.6px',
                marginBottom: 6
              }}
            >
              <Sparkles size={11} /> {header.tag}
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.4px', margin: 0 }}>
              {header.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
          {header.subtitle}
        </p>

        {/* Feature Comparison Highlights */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 9
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontWeight: 600 }}>
              <Layers size={14} color="var(--accent-volt)" /> Unlimited Custom Routines
            </span>
            <span style={{ color: 'var(--accent-volt)', fontWeight: 800 }}>PRO</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontWeight: 600 }}>
              <Bot size={14} color="var(--accent-cyan)" /> Unlimited Gemini AI Coach & Swaps
            </span>
            <span style={{ color: 'var(--accent-volt)', fontWeight: 800 }}>PRO</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontWeight: 600 }}>
              <TrendingUp size={14} color="#FFB800" /> Volume Landmarks (MEV / MAV / MRV)
            </span>
            <span style={{ color: 'var(--accent-volt)', fontWeight: 800 }}>PRO</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontWeight: 600 }}>
              <Activity size={14} color="#A78BFA" /> Mesocycle Fatigue & Deload Engine
            </span>
            <span style={{ color: 'var(--accent-volt)', fontWeight: 800 }}>PRO</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
              <Check size={14} color="var(--accent-volt)" /> 1,515 Watermark-Free Visual Form Guides
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Included Free</span>
          </div>
        </div>

        {/* Currency Indicator */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-secondary)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span>{currencyConfig.flag}</span>
            <span>{currencyConfig.code} ({currencyConfig.symbol})</span>
          </span>
        </div>

        {/* Pricing Plan Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => handleSelectPlan(plan.id)}
                style={{
                  position: 'relative',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(0, 245, 155, 0.12) 0%, rgba(0, 229, 255, 0.06) 100%)'
                    : 'var(--bg-surface)',
                  border: isSelected ? '1.5px solid var(--accent-volt)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: isSelected ? '0 0 16px rgba(0, 245, 155, 0.2)' : 'none'
                }}
              >
                {plan.badge && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -9,
                      right: 14,
                      background: 'var(--accent-volt)',
                      color: '#050D0A',
                      fontSize: '0.62rem',
                      fontWeight: 900,
                      borderRadius: 'var(--radius-full)',
                      padding: '2px 8px',
                      letterSpacing: '0.4px',
                      boxShadow: '0 2px 8px rgba(0, 245, 155, 0.4)'
                    }}
                  >
                    {plan.badge}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 'var(--radius-full)',
                      border: isSelected ? '2px solid var(--accent-volt)' : '2px solid var(--border-medium)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected ? 'var(--accent-volt)' : 'transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isSelected && <Check size={12} color="#050D0A" strokeWidth={3} />}
                  </div>

                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff' }}>{plan.title}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{plan.subtext}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: isSelected ? 'var(--accent-volt)' : '#fff' }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginLeft: 3 }}>
                    {plan.period}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Restore message feedback */}
        {restoreMessage && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 229, 255, 0.1)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              fontSize: '0.76rem',
              color: 'var(--accent-cyan)',
              textAlign: 'center'
            }}
          >
            {restoreMessage}
          </div>
        )}

        {/* Action Button */}
        <button
          className="btn-primary"
          onClick={handleSubscribe}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '1rem',
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 4px 20px rgba(0, 245, 155, 0.35)'
          }}
        >
          <span>Unlock Overload Pro</span>
          <ArrowRight size={18} />
        </button>

        {/* Google Play Compliance Footer: Restore Purchases & Legal Links */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            alignItems: 'center',
            textAlign: 'center',
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            lineHeight: 1.4
          }}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleRestore}
              disabled={restoring}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-cyan)',
                fontWeight: 700,
                fontSize: '0.72rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <RotateCcw size={12} />
              {restoring ? 'Restoring...' : 'Restore Purchases'}
            </button>

            <span>•</span>

            <button
              type="button"
              onClick={handleToggleDevMode}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.7rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
              title="Quickly test Free vs Pro in development"
            >
              Dev Mode Toggle
            </button>
          </div>

          <div>
            Secure Google Play Billing. Cancel anytime in Google Play Store subscriptions.
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.7rem', marginTop: 2 }}>
            <a
              href="https://praiseojay.github.io/Gym_app/privacy-policy.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}
            >
              Privacy Policy
            </a>
            <span>•</span>
            <a
              href="https://praiseojay.github.io/Gym_app/terms.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-volt)', textDecoration: 'underline' }}
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </SwipeableModalSheet>
  );
};
