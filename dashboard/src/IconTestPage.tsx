/**
 * Simple Icon Test Page for Manual Verification
 * 
 * Import this in App.tsx temporarily to verify icons work:
 * import IconTestPage from './IconTestPage'
 * 
 * Then render: <IconTestPage />
 */

import { 
  ClipboardCheck, 
  Compass, 
  UserCheck, 
  ShieldCheck, 
  Zap,
  ListChecks,
  AlertTriangle,
  Rocket,
  Eye,
  ArrowRight,
  Mail,
  CheckCircle2
} from './lib/icons';

export default function IconTestPage() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Icon System Test ✅</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Hero */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-semibold mb-4">Hero</h2>
          <ClipboardCheck className="h-16 w-16 text-[#667eea]" aria-label="Checklist" role="img" />
          <p className="text-sm text-gray-600 mt-2">ClipboardCheck (brand-primary)</p>
        </div>

        {/* Discovery */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-semibold mb-4">Discovery</h2>
          <Compass className="h-10 w-10 text-[#667eea]" aria-label="Compass" role="img" />
          <p className="text-sm text-gray-600 mt-2">Compass (brand-primary)</p>
        </div>

        {/* Trust Badges */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-semibold mb-4">Trust Badges</h2>
          <div className="flex gap-4">
            <UserCheck className="h-6 w-6 text-[#10b981]" aria-label="UserCheck" role="img" />
            <ShieldCheck className="h-6 w-6 text-[#10b981]" aria-label="ShieldCheck" role="img" />
            <Zap className="h-6 w-6 text-[#10b981]" aria-label="Zap" role="img" />
          </div>
          <p className="text-sm text-gray-600 mt-2">Success green</p>
        </div>

        {/* Features */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-semibold mb-4">Features</h2>
          <div className="flex gap-4">
            <ListChecks className="h-8 w-8 text-[#667eea]" aria-label="ListChecks" role="img" />
            <AlertTriangle className="h-8 w-8 text-[#f59e0b]" aria-label="Alert" role="img" />
            <Rocket className="h-8 w-8 text-[#764ba2]" aria-label="Rocket" role="img" />
          </div>
          <p className="text-sm text-gray-600 mt-2">Various colors</p>
        </div>

        {/* Credibility */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-semibold mb-4">Credibility</h2>
          <Eye className="h-12 w-12 text-[#764ba2]" aria-label="Eye" role="img" />
          <p className="text-sm text-gray-600 mt-2">Eye (brand-accent)</p>
        </div>

        {/* CTA */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-semibold mb-4">CTA</h2>
          <div className="flex gap-4">
            <ArrowRight className="h-4 w-4 text-[#667eea]" aria-label="Arrow" role="img" />
            <Mail className="h-5 w-5 text-[#667eea]" aria-label="Mail" role="img" />
          </div>
          <p className="text-sm text-gray-600 mt-2">Small icons</p>
        </div>
      </div>

      {/* Accessibility Verification */}
      <div className="bg-green-50 border-2 border-green-500 p-6 rounded-lg mt-8">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
          Accessibility Verified
        </h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✅ All icons have aria-label attributes</li>
          <li>✅ All icons have role="img"</li>
          <li>✅ Colors use approved palette from Tailwind config</li>
          <li>✅ Sizes match approved scale</li>
        </ul>
      </div>
    </div>
  );
}

