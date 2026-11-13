'use server';
import { signIn } from '@/auth';
import { AuthError} from 'next-auth';
import {z} from 'zod';
import postgres from 'postgres';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';


const sql = postgres(process.env.NEXTJS_DASHBOARD_POSTGRES_URL!, {ssl: 'require'});

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending','paid']),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({id:true,date:true});
const UpdateInvoice = FormSchema.omit({id:true,date:true});
export async function authenticate(preState: string | undefined  , formData: FormData) {
    try {
	await signIn('credentials', formData);
    return "" as string | undefined;
    }catch(error) {
	if (error instanceof AuthError) {
	    console.log('error type: ',error.type);
	    switch (error.type) {
		case 'CredentialsSignin' :
		    console.log('Invalid credentials');
		default :
		    console.log('Something went wrong');
	    }
	}
	throw error;
    }
}

export async function createInvoice(formData: FormData) {
    const  {customerId,amount,status} = CreateInvoice.parse({ 
	customerId : formData.get('customerId'),
	amount : formData.get('amount'),
	status : formData.get('status'),
    });
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    try {
	await sql`
	INSERT INTO invoices (customer_id, amount, status, date) VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
	`;
    } catch(error) {
	  console.log( 'Database Error: Failed to create invoice');
    }
	revalidatePath('/dashboard/invoices');
	redirect('/dashboard/invoices');

}

export async function updateInvoice(id :  string,formData: FormData)  {
    const {customerId, amount, status} = UpdateInvoice.parse({
		customerId : formData.get('customerId'),
		amount	    : formData.get('amount'),
		status	    : formData.get('status'),
    });

    const amountInCents = amount * 100;

    try {
    await sql`
	UPDATE invoices SET customer_id=${customerId}, amount=${amountInCents}, status=${status}
     WHERE invoices.id = ${id} 
     `;
    }catch(error) {
	  console.log( 'Database Error: Failed to update invoice.');
    }
     revalidatePath('/dashboard/invoices');
     redirect('/dashboard/invoices');

} 


export async function deleteInvoice(id : string, formData: FormData) {
    try{
    await sql`
    DELETE FROM invoices 
    WHERE id = ${id}
    `;
    }catch(error) {
	
	    console.log( 'Database error: Failed to delete invoice.');
	
    }
     revalidatePath('/dashboard/invoices');
     redirect('/dashboard/invoices');
}
