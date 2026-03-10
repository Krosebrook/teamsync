import React from 'react';
import { X, TrendingUp, Users, Clock, CheckCircle } from 'lucide-react';

const DetailModal = ({ detail, onClose }) => {
  const renderSuccessRateDetail = (data) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-xs text-slate-600 font-medium mb-1">Success Rate</p>
          <p className="text-3xl font-bold text-blue-600">{data.data.completion}%</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-xs text-slate-600 font-medium mb-1">Successful Simulations</p>
          <p className="text-3xl font-bold text-green-600">{data.data.successful}/{data.data.total}</p>
        </div>
      </div>
      <div className="border-t border-slate-200 pt-4">
        <h4 className="font-semibold text-slate-900 mb-3">Trend Analysis</h4>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>On {data.data.date}, {data.data.total} simulations were conducted</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>Success completion rate reached {data.data.completion}%, indicating {data.data.completion >= 70 ? 'strong' : 'moderate'} performance</span>
          </li>
        </ul>
      </div>
    </div>
  );

  const renderTensionDetail = (data) => (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-6 h-6 rounded"
            style={{ backgroundColor: data.data.fill }}
          ></div>
          <div>
            <p className="text-xs text-slate-600 font-medium">Severity Level</p>
            <p className="text-2xl font-bold text-slate-900">{data.data.severity}</p>
          </div>
        </div>
        <p className="text-3xl font-bold text-slate-900">{data.data.count} instances</p>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <h4 className="font-semibold text-slate-900 mb-3">Impact Assessment</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b border-slate-200">
            <span className="text-sm text-slate-700">Tension Severity</span>
            <span className="text-sm font-semibold" style={{ color: data.data.fill }}>
              {data.data.severity}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-200">
            <span className="text-sm text-slate-700">Occurrences</span>
            <span className="text-sm font-semibold text-slate-900">{data.data.count}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-700">Risk Level</span>
            <span className={`text-sm font-semibold px-2 py-1 rounded ${
              data.data.severity === 'Critical' ? 'bg-red-100 text-red-700' :
              data.data.severity === 'High' ? 'bg-orange-100 text-orange-700' :
              data.data.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {data.data.severity === 'Critical' ? 'Critical' : 'Manageable'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-900">
          <span className="font-semibold">Insight:</span> {data.data.severity} severity tensions are occurring {data.data.count} times in your simulations. Consider adding conflict resolution strategies or team communication protocols.
        </p>
      </div>
    </div>
  );

  const renderPersonaDetail = (data) => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-xs text-slate-600 font-medium mb-2">Interactions</p>
          <p className="text-2xl font-bold text-purple-600">{Math.round(data.data.interactions)}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg">
          <p className="text-xs text-slate-600 font-medium mb-2">Avg Response</p>
          <p className="text-2xl font-bold text-amber-600">{data.data.avgResponseTime}ms</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-lg">
          <p className="text-xs text-slate-600 font-medium mb-2">Completion</p>
          <p className="text-2xl font-bold text-emerald-600">{data.data.completionRate}%</p>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <h4 className="font-semibold text-slate-900 mb-3">Performance Breakdown</h4>
        <div className="space-y-3">
          {/* Completion Rate Bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-700">Completion Rate</span>
              <span className="text-sm font-semibold text-slate-900">{data.data.completionRate}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${data.data.completionRate}%` }}
              ></div>
            </div>
          </div>

          {/* Response Time */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-700">Response Speed</span>
              <span className="text-sm font-semibold text-slate-900">{data.data.avgResponseTime}ms</span>
            </div>
            <p className="text-xs text-slate-500">
              {data.data.avgResponseTime < 200 ? 'Excellent response time' :
               data.data.avgResponseTime < 400 ? 'Good response time' :
               'Slow response time - consider optimization'}
            </p>
          </div>

          {/* Engagement */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-700">Engagement Level</span>
              <span className="text-sm font-semibold text-slate-900">{Math.round(data.data.interactions)}</span>
            </div>
            <p className="text-xs text-slate-500">
              {Math.round(data.data.interactions) > 150 ? 'High engagement' :
               Math.round(data.data.interactions) > 100 ? 'Moderate engagement' :
               'Low engagement - increase interaction opportunities'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <p className="text-xs text-slate-700">
          <span className="font-semibold">Recommendation:</span> The {data.data.name} persona shows {data.data.completionRate >= 80 ? 'strong' : 'moderate'} completion rates with {data.data.avgResponseTime < 250 ? 'quick' : 'moderate'} response times.
        </p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (detail.type) {
      case 'successRate':
        return renderSuccessRateDetail(detail);
      case 'tension':
        return renderTensionDetail(detail);
      case 'persona':
        return renderPersonaDetail(detail);
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (detail.type) {
      case 'successRate':
        return `Success Rate: ${detail.data.date}`;
      case 'tension':
        return `${detail.data.severity} Tension Analysis`;
      case 'persona':
        return `${detail.data.name} Persona Performance`;
      default:
        return 'Details';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">{getTitle()}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default DetailModal;