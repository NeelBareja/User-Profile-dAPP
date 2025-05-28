"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, User, Search, Plus, LogOut } from "lucide-react"

// Contract ABI
const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "string", name: "_name", type: "string" },
      { internalType: "uint256", name: "_age", type: "uint256" },
      { internalType: "string", name: "_profession", type: "string" },
      { internalType: "string", name: "_bio", type: "string" },
    ],
    name: "addUserInfo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "userAddress", type: "address" }],
    name: "getUserInfo",
    outputs: [
      { internalType: "string", name: "", type: "string" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "string", name: "", type: "string" },
      { internalType: "string", name: "", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "address", name: "user", type: "address" }],
    name: "userInfoAdded",
    type: "event",
  },
]

// Replace with your deployed contract address
const CONTRACT_ADDRESS = "0x8d5544a040e682A0BB296e68F70472cE059344A7" // Add your contract address here

interface UserData {
  name: string
  age: number
  profession: string
  bio: string
}

export default function UserInfoDApp() {
  const [account, setAccount] = useState<string>("")
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    profession: "",
    bio: "",
  })

  // User data state
  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null)
  const [searchAddress, setSearchAddress] = useState("")
  const [searchedUserData, setSearchedUserData] = useState<UserData | null>(null)

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.send("eth_requestAccounts", [])
        const signer = await provider.getSigner()
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

        setProvider(provider)
        setSigner(signer)
        setContract(contract)
        setAccount(accounts[0])
        setError("")
        setSuccess("Wallet connected successfully!")

        // Load current user data - pass the account address directly since state hasn't updated yet
        await loadUserDataForCurrentUser(accounts[0], contract)
      } else {
        setError("Please install MetaMask to use this application")
      }
    } catch (err: any) {
      setError(`Failed to connect wallet: ${err.message}`)
    }
  }

  // Disconnect wallet
  const disconnectWallet = () => {
    setProvider(null)
    setSigner(null)
    setContract(null)
    setAccount("")
    setCurrentUserData(null)
    setSearchedUserData(null)
    setSearchAddress("")
    setFormData({ name: "", age: "", profession: "", bio: "" })
    setError("")
    setSuccess("Wallet disconnected successfully!")
  }

  // Add user info
  const addUserInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contract || !signer) {
      setError("Please connect your wallet first")
      return
    }

    // Validate and sanitize inputs
    const sanitizedName = formData.name.trim().replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove zero-width characters
    const sanitizedProfession = formData.profession.trim().replace(/[\u200B-\u200D\uFEFF]/g, "")
    const sanitizedBio = formData.bio.trim().replace(/[\u200B-\u200D\uFEFF]/g, "")
    const age = Number.parseInt(formData.age)

    // Validation
    if (!sanitizedName || sanitizedName.length === 0) {
      setError("Name cannot be empty")
      return
    }
    if (!sanitizedProfession || sanitizedProfession.length === 0) {
      setError("Profession cannot be empty")
      return
    }
    if (!sanitizedBio || sanitizedBio.length === 0) {
      setError("Bio cannot be empty")
      return
    }
    if (isNaN(age) || age <= 0 || age > 150) {
      setError("Please enter a valid age between 1 and 150")
      return
    }

    try {
      setLoading(true)
      setError("")

      console.log("Calling contract with:", {
        name: sanitizedName,
        age: age,
        profession: sanitizedProfession,
        bio: sanitizedBio,
      })

      // Call the contract function with sanitized inputs
      const tx = await contract.addUserInfo(sanitizedName, age, sanitizedProfession, sanitizedBio)

      console.log("Transaction sent:", tx.hash)

      // Wait for transaction confirmation
      const receipt = await tx.wait()
      console.log("Transaction confirmed:", receipt)

      setSuccess("User information added successfully!")

      // Reload current user data
      await loadUserDataForCurrentUser(account)

      // Reset form
      setFormData({ name: "", age: "", profession: "", bio: "" })
    } catch (err: any) {
      console.error("Full error object:", err)

      // More specific error handling
      if (err.code === "INVALID_ARGUMENT") {
        setError("Invalid input data. Please check your entries and try again.")
      } else if (err.code === "UNPREDICTABLE_GAS_LIMIT") {
        setError("Transaction failed. Please check your inputs and try again.")
      } else if (err.message?.includes("user rejected")) {
        setError("Transaction was rejected by user")
      } else if (err.message?.includes("insufficient funds")) {
        setError("Insufficient funds to complete the transaction")
      } else {
        setError(`Failed to add user info: ${err.reason || err.message || "Unknown error"}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Load current user data
  const loadUserDataForCurrentUser = async (userAddress: string, contractInstance?: ethers.Contract) => {
    try {
      const contractToUse = contractInstance || contract
      if (!contractToUse) return

      console.log("Loading current user data for address:", userAddress)

      const userData = await contractToUse.getUserInfo(userAddress)
      console.log("Raw current user data:", userData)

      if (userData[0] && userData[0].length > 0) {
        const userInfo: UserData = {
          name: userData[0],
          age: Number(userData[1]),
          profession: userData[2],
          bio: userData[3],
        }
        console.log("Setting current user data:", userInfo)
        setCurrentUserData(userInfo)
      } else {
        console.log("No current user data found")
        setCurrentUserData(null)
      }
    } catch (err: any) {
      console.error("Error loading current user data:", err)
      setCurrentUserData(null)
    }
  }

  // Load searched user data
  const loadUserData = async (address: string) => {
    try {
      if (!contract) return

      // Validate address format
      if (!ethers.isAddress(address)) {
        console.error("Invalid address format:", address)
        return
      }

      console.log("Loading searched user data for address:", address)

      const userData = await contract.getUserInfo(address)
      console.log("Raw searched user data:", userData)

      if (userData[0] && userData[0].length > 0) {
        const userInfo: UserData = {
          name: userData[0],
          age: Number(userData[1]),
          profession: userData[2],
          bio: userData[3],
        }
        console.log("Setting searched user data:", userInfo)
        setSearchedUserData(userInfo)
      } else {
        console.log("No searched user data found for address:", address)
        setSearchedUserData(null)
      }
    } catch (err: any) {
      console.error("Error loading searched user data:", err)
      setSearchedUserData(null)
    }
  }

  // Search user
  const searchUser = async () => {
    if (!contract || !searchAddress) return

    // Validate address format
    if (!ethers.isAddress(searchAddress)) {
      setError("Please enter a valid Ethereum address")
      return
    }

    try {
      setLoading(true)
      setError("")
      setSearchedUserData(null) // Clear previous results
      await loadUserData(searchAddress)
    } catch (err: any) {
      setError(`Failed to search user: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("")
        setSuccess("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">UserInfo DApp</h1>
          <p className="text-gray-600">Decentralized user profile management on the blockchain</p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Wallet Connection */}
        {!account ? (
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Wallet className="h-6 w-6" />
                Connect Your Wallet
              </CardTitle>
              <CardDescription>Connect your wallet to interact with the UserInfo smart contract</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={connectWallet} size="lg">
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Connected Account */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Connected Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-mono text-sm bg-gray-100 p-2 rounded">{account}</p>
                <Button onClick={disconnectWallet} variant="outline" size="sm" className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Disconnect Wallet
                </Button>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Add User Info Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add/Update Your Info
                  </CardTitle>
                  <CardDescription>Add or update your profile information on the blockchain</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={addUserInfo} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter your name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        placeholder="Enter your age"
                        min="1"
                        max="150"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profession">Profession</Label>
                      <Input
                        id="profession"
                        value={formData.profession}
                        onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                        placeholder="Enter your profession"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                        rows={3}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Adding..." : "Add User Info"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Current User Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Your Profile
                  </CardTitle>
                  <CardDescription>Your current information stored on the blockchain</CardDescription>
                </CardHeader>
                <CardContent>
                  {currentUserData ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Name</Label>
                        <p className="text-lg font-semibold">{currentUserData.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Age</Label>
                        <p>{currentUserData.age} years old</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Profession</Label>
                        <p>{currentUserData.profession}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Bio</Label>
                        <p className="text-sm text-gray-700">{currentUserData.bio}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No profile information found</p>
                      <p className="text-sm">Add your information using the form</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Search User */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search User Profile
                </CardTitle>
                <CardDescription>Enter an Ethereum address to view their profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    placeholder="0x..."
                    className="font-mono"
                  />
                  <Button onClick={searchUser} disabled={loading || !searchAddress}>
                    Search
                  </Button>
                </div>

                {searchedUserData && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Name</Label>
                        <p className="text-lg font-semibold">{searchedUserData.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Age</Label>
                        <p>{searchedUserData.age} years old</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Profession</Label>
                        <p>{searchedUserData.profession}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Bio</Label>
                        <p className="text-sm text-gray-700">{searchedUserData.bio}</p>
                      </div>
                    </div>
                  </>
                )}

                {searchAddress && searchedUserData === null && !loading && (
                  <div className="text-center py-4 text-gray-500">
                    <p>No profile found for this address</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
