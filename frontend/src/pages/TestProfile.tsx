const TestProfile = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Page Test</h1>
          <p className="text-gray-600">Profile routing is working correctly!</p>
          <div className="mt-4 space-y-2">
            <a href="/profile/edit" className="block text-blue-600 hover:underline">
              Go to Edit Profile
            </a>
            <a href="/profile/change-password" className="block text-blue-600 hover:underline">
              Go to Change Password
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestProfile