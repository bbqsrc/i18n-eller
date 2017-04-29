// Generated.
package example.generated

import android.content.Context
import example.R

object Strings {
    private lateinit var context: Context

    fun init(context: Context) {
      this.context = context
    }

    private fun stringForKey(key: Int, vararg args: Any): String {
        return context.resources.getString(key, *args)
    }

    private fun stringArrayForKey(key: Int): List<String> {
        return context.resources.getStringArray(key).toList()
    }

    val firstItem: String
        get() = stringForKey(R.string.first_item)

    fun anotherItem(number: String): String =
        stringForKey(R.string.another_item, number)
}
