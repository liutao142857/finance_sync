
import React from 'react';
import { 
  Utensils, Coffee, ShoppingBag, Car, Plane, Baby, 
  Stethoscope, Wallet, Gift, Smartphone, Cigarette, 
  GraduationCap, Home, Sparkles, HeartPulse, Gamepad2, 
  Zap, MoreHorizontal, Landmark, CreditCard, Banknote
} from 'lucide-react';
import { Category } from './types';

export const CATEGORIES: Category[] = [
  { id: 'meals', name: '三餐', icon: 'Utensils', type: 'expense' },
  { id: 'snacks', name: '零食', icon: 'Coffee', type: 'expense' },
  { id: 'clothes', name: '衣服', icon: 'ShoppingBag', type: 'expense' },
  { id: 'transport', name: '交通', icon: 'Car', type: 'expense' },
  { id: 'travel', name: '旅行', icon: 'Plane', type: 'expense' },
  { id: 'kids', name: '孩子', icon: 'Baby', type: 'expense' },
  { id: 'medical', name: '医疗', icon: 'Stethoscope', type: 'expense' },
  { id: 'coffee', name: '咖啡', icon: 'Coffee', type: 'expense' },
  { id: 'phone', name: '话费网费', icon: 'Smartphone', type: 'expense' },
  { id: 'smoke', name: '烟酒', icon: 'Cigarette', type: 'expense' },
  { id: 'study', name: '学习', icon: 'GraduationCap', type: 'expense' },
  { id: 'housing', name: '住房', icon: 'Home', type: 'expense' },
  { id: 'beauty', name: '美妆', icon: 'Sparkles', type: 'expense' },
  { id: 'gift', name: '送礼', icon: 'Gift', type: 'expense' },
  { id: 'digital', name: '数码', icon: 'Gamepad2', type: 'expense' },
  { id: 'sports', name: '运动', icon: 'HeartPulse', type: 'expense' },
  { id: 'utilities', name: '水电煤', icon: 'Zap', type: 'expense' },
  { id: 'other', name: '其它', icon: 'MoreHorizontal', type: 'expense' },
  
  { id: 'salary', name: '工资', icon: 'Wallet', type: 'income' },
  { id: 'bonus', name: '奖金', icon: 'Sparkles', type: 'income' },
  { id: 'investment', name: '投资', icon: 'Landmark', type: 'income' },
  { id: 'redpacket', name: '发红包', icon: 'Gift', type: 'income' },
];

export const ACCOUNTS = ['默认资产', '支付宝', '微信支付', '银行卡', '现金'];
export const LEDGERS = ['初始账本', '日常账本', '装修账本', '旅游账本'];

export const ICON_MAP: Record<string, any> = {
  Utensils, Coffee, ShoppingBag, Car, Plane, Baby, 
  Stethoscope, Wallet, Gift, Smartphone, Cigarette, 
  GraduationCap, Home, Sparkles, HeartPulse, Gamepad2, 
  Zap, MoreHorizontal, Landmark, CreditCard, Banknote
};
