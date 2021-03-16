using System;
using System.Linq;

namespace Martianizer
{
    /// <summary>
    /// Contains extension methods for demartianizing Enum string values.
    /// </summary>
    public static class EnumDemartianizeExtensions
    {
        /// <summary>
        /// Demartianizes a string into the Enum it was originally Martianized from!
        /// </summary>
        /// <typeparam name="TTargetEnum">The target enum</typeparam>
        /// <param name="input">The string to be converted</param>
        /// <exception cref="ArgumentException">If TTargetEnum is not an enum</exception>
        /// <exception cref="NoMatchFoundException">Couldn't find any enum member that matches the string</exception>
        /// <returns></returns>
        public static TTargetEnum DemartianizeTo<TTargetEnum>(this string input)
            where TTargetEnum : struct, IComparable, IFormattable
        {
            return (TTargetEnum)DemartianizeToPrivate(input, typeof(TTargetEnum), OnNoMatch.ThrowsException);
        }

        /// <summary>
        /// Demartianizes a string into the Enum it was originally Martianized from!
        /// </summary>
        /// <param name="input">The string to be converted</param>
        /// <param name="targetEnum">The target enum</param>
        /// <param name="onNoMatch">What to do when input is not matched to the enum.</param>
        /// <returns></returns>
        /// <exception cref="NoMatchFoundException">Couldn't find any enum member that matches the string</exception>
        /// <exception cref="ArgumentException">If targetEnum is not an enum</exception>
        public static Enum DemartianizeTo(this string input, Type targetEnum, OnNoMatch onNoMatch = OnNoMatch.ThrowsException)
        {
            return (Enum)DemartianizeToPrivate(input, targetEnum, onNoMatch);
        }

        private static object DemartianizeToPrivate(string input, Type targetEnum, OnNoMatch onNoMatch)
        {
            var match = Enum.GetValues(targetEnum).Cast<Enum>().FirstOrDefault(value => string.Equals(value.Martianize(), input, StringComparison.OrdinalIgnoreCase));

            if (match == null && onNoMatch == OnNoMatch.ThrowsException)
            {
                throw new NoMatchFoundException("Couldn't find any enum member that matches the string " + input);
            }

            return match;
        }
    }
}