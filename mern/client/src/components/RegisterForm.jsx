import { useState } from "react";
import { register } from "../firebase";
import { useDispatch } from "react-redux";
import { login as loginHandle } from "../redux/userSlice";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = await register(email, password);
    dispatch(loginHandle(user));
  };
  return (
    <form
      className="max-w-xl mx-auto grid gap-y-4 py-4 "
      onSubmit={handleSubmit}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700">
          E-mail
        </label>
        <div className="mt-1">
          <input
            type="text"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-900 rounded-md "
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Parola
        </label>
        <div className="mt-1 rounded-md">
          <input
            type="password"
            className="shadow-sm focus:ring-indigo-500 border  focus:border-indigo-500 block w-full sm:text-sm border-gray-900 h-10 rounded-md"
            placeholder="*******"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>
      <div>
        <button
          disabled={!email || !password}
          type="submit"
          className="inline-flex disabled:opacity-40 items-center justify-center px-4 py-2 border  border-transparent bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 cursor-pointer focus:ring-offset-2 focus:ring-indigo-500 text-white font-medium "
        >
          Register
        </button>
      </div>
    </form>
  );
};

export default Register;
