import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page = await context.new_page()

        # Go to the app
        await page.goto('http://localhost:5173')

        # Wait for page to load
        await page.wait_for_selector('text=Configurações', timeout=10000)

        # Click settings
        await page.click('text=Configurações')

        # Click "Moradores & Cargos" (Membros)
        await page.click('text=Moradores & Cargos')

        # Click "Novo Morador" (there is a button with this text or icon)
        # Based on screenshots it's a prominent button
        await page.click('button:has-text("Novo Morador")')

        # Fill name
        await page.fill('input#nome', 'Luana Oliveira')

        # Fill password
        password_input = page.locator('input#senha')
        await password_input.fill('secret123')

        # Verify initial state is password
        assert await password_input.get_attribute('type') == 'password'

        # Click toggle
        await page.click('button[aria-label="Mostrar senha"]')

        # Verify state is text
        assert await password_input.get_attribute('type') == 'text'

        # Take screenshot of visible password
        os.makedirs('verification_final', exist_ok=True)
        await page.screenshot(path='verification_final/password_visible.png')

        # Click toggle again
        await page.click('button[aria-label="Ocultar senha"]')

        # Verify state is password again
        assert await password_input.get_attribute('type') == 'password'

        await browser.close()
        print("Verification successful!")

if __name__ == '__main__':
    asyncio.run(run())
