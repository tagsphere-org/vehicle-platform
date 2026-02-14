import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import features from '../config/features'
import api from '../services/api'

function Pricing() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [currentPlan, setCurrentPlan] = useState(null)
  const [paymentsEnabled, setPaymentsEnabled] = useState(features.razorpay)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentPlan()
    }
    api.get('/subscription/plans').then(({ data }) => {
      setPaymentsEnabled(data.paymentsEnabled)
    }).catch(() => {})
  }, [isAuthenticated])

  const fetchCurrentPlan = async () => {
    try {
      const response = await api.get('/subscription/my-plan')
      setCurrentPlan(response.data)
    } catch {
      // User might not have a subscription yet
    }
  }

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleSubscribe = async (plan) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (!paymentsEnabled) return

    setLoading(true)
    setMessage('')

    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        setMessage('Failed to load payment gateway. Please try again.')
        setLoading(false)
        return
      }

      const { data } = await api.post('/subscription/create-order', { plan })

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'TagSphere',
        description: `${plan === 'basic' ? 'Basic' : 'Premium'} Plan - Monthly`,
        order_id: data.orderId,
        handler: async function (response) {
          try {
            await api.post('/subscription/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan
            })
            setMessage('Payment successful! Your plan has been upgraded.')
            fetchCurrentPlan()
          } catch {
            setMessage('Payment verification failed. Please contact support.')
          }
        },
        prefill: {},
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: function () {
            setLoading(false)
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function () {
        setMessage('Payment failed. Please try again.')
        setLoading(false)
      })
      rzp.open()
      setLoading(false)
    } catch {
      setMessage('Failed to create order. Please try again.')
      setLoading(false)
    }
  }

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: '',
      description: 'Get started with basic vehicle protection',
      features: [
        'Register up to 2 vehicles',
        'QR code generation',
        'Basic scan alerts',
        'Vehicle info display on scan'
      ],
      cta: currentPlan?.plan === 'free' ? 'Current Plan' : 'Get Started',
      disabled: true
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 149,
      period: '/month',
      description: '25 notification + 25 call credits per month',
      features: [
        'Everything in Free',
        '25 notification credits/month',
        '25 call credits/month',
        'Scan activity history'
      ],
      cta: currentPlan?.plan === 'basic' ? 'Current Plan' : 'Subscribe',
      disabled: currentPlan?.plan === 'basic' || currentPlan?.plan === 'premium'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 299,
      period: '/month',
      description: '50 notification + 50 call credits per month',
      features: [
        'Everything in Basic',
        '50 notification credits/month',
        '50 call credits/month',
        'Priority support'
      ],
      cta: currentPlan?.plan === 'premium' ? 'Current Plan' : 'Subscribe',
      disabled: currentPlan?.plan === 'premium',
      featured: true
    }
  ]

  return (
    <div className="pricing-section">
      <div className="container">
        <h1 className="section-heading">Choose Your Plan</h1>
        <p className="section-subheading">
          Protect your vehicle with smart notifications and instant contact features
        </p>

        {message && (
          <div className={`alert ${message.includes('successful') ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}

        <div className="pricing-grid">
          {plans.map((plan) => (
            <div key={plan.id} className={`pricing-card${plan.featured ? ' featured' : ''}`}>
              {plan.featured && <div className="pricing-badge">Most Popular</div>}
              <h2 className="pricing-plan-name">{plan.name}</h2>
              <div className="pricing-price">
                {plan.price === 0 ? (
                  <span className="pricing-amount">Free</span>
                ) : (
                  <>
                    <span className="pricing-currency">&#8377;</span>
                    <span className="pricing-amount">{plan.price}</span>
                    <span className="pricing-period">{plan.period}</span>
                  </>
                )}
              </div>
              <p className="pricing-description">{plan.description}</p>
              <ul className="pricing-features">
                {plan.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
              {plan.id === 'free' ? (
                isAuthenticated ? (
                  <button className="btn btn-outline" disabled>
                    {currentPlan?.plan === 'free' ? 'Current Plan' : 'Free Tier'}
                  </button>
                ) : (
                  <Link to="/register" className="btn btn-outline">Get Started</Link>
                )
              ) : !paymentsEnabled ? (
                <button className="btn btn-outline" disabled>
                  Payments Coming Soon
                </button>
              ) : (
                <button
                  className={`btn ${plan.featured ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={plan.disabled || loading}
                >
                  {loading ? 'Processing...' : plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        {!features.calls && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Call credits will be activated once direct calls are launched.
          </div>
        )}

        <div className="pricing-footer">
          <p>All plans include a 30-day billing cycle. No automatic renewals.</p>
          <p>
            Questions? <a href="mailto:contact@tagsphere.co.in">Contact us</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Pricing
