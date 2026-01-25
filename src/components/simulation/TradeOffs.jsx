import React from 'react';
import { motion } from "framer-motion";
import { Scale, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function TradeOffs({ tradeOffs }) {
  if (!tradeOffs || tradeOffs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {tradeOffs.map((tradeOff, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-4 h-4 text-violet-600" />
              <h4 className="font-semibold text-slate-800 text-sm">
                {tradeOff.trade_off}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-xs font-medium text-blue-900 mb-1">Option A</p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {tradeOff.option_a}
                </p>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-slate-300" />
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 col-start-2">
                <p className="text-xs font-medium text-emerald-900 mb-1">Option B</p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {tradeOff.option_b}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}